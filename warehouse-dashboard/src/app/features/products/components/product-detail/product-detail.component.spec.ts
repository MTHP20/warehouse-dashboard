import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { ProductService } from '../../../../core/services/product.service';
import { Product, Order } from '../../../../core/models/product.model';

const MOCK_PRODUCT: Product = {
  id: '1',
  name: 'Mechanical Keyboard',
  category: 'Peripherals',
  stockLevel: 142,
  status: 'In Stock',
};

const MOCK_CRITICAL_PRODUCT: Product = {
  id: '2',
  name: 'Wireless Keyboard',
  category: 'Peripherals',
  stockLevel: 14,
  status: 'Low Stock',
};

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', productId: '1', quantity: -5, date: '2025-05-28' },
  { id: 'ORD-002', productId: '1', quantity: 50, date: '2025-05-10' },
  { id: 'ORD-003', productId: '1', quantity: -8, date: '2025-05-30' },
];

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let mockProductService: {
    getProduct: ReturnType<typeof vi.fn>;
    getOrderHistory: ReturnType<typeof vi.fn>;
  };
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let paramMapSubject: BehaviorSubject<any>;

  const createComponent = () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    vi.useFakeTimers();

    paramMapSubject = new BehaviorSubject(convertToParamMap({ id: '1' }));

    mockProductService = {
      getProduct: vi.fn().mockReturnValue(of(MOCK_PRODUCT)),
      getOrderHistory: vi.fn().mockReturnValue(of(MOCK_ORDERS)),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        { provide: ProductService, useValue: mockProductService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
            snapshot: { paramMap: convertToParamMap({ id: '1' }) },
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // TEST CASE 1 - Loading state TRUE before data resolves
  it('should show loading state before data resolves', () => {
    mockProductService.getProduct.mockReturnValue(new BehaviorSubject(null).asObservable());
    mockProductService.getOrderHistory.mockReturnValue(new BehaviorSubject(null).asObservable());

    createComponent();

    expect(component.loading()).toBe(true);
    expect(component.product()).toBeNull();
    expect(component.error()).toBeNull();
  });

  // TEST CASE 2 - Renders product data with corresponding orders are successful load
  it('should set product and orders and clear loading after successful load', async () => {
    createComponent();

    await vi.advanceTimersByTimeAsync(600);

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.product()).toMatchObject({
      id: '1',
      name: 'Mechanical Keyboard',
      category: 'Peripherals',
      stockLevel: 142,
      status: 'In Stock',
    });
    expect(component.orders()).toHaveLength(3);
    expect(component.orders()[0].id).toBe('ORD-001');
  });

  // TEST CASE 3 - User-friendly error when API call fails
  it('should set error signal with user-friendly message when API fails', async () => {
    mockProductService.getProduct.mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    createComponent();
    await vi.advanceTimersByTimeAsync(0);

    expect(component.error()).toBe('Unable to load product details. Try again.');
    expect(component.loading()).toBe(false);
    expect(component.product()).toBeNull();
  });

  // TEST CASE 4 - Reloads data when route param changes
  it('should reload data automatically when route param changes', async () => {
    createComponent();
    await vi.advanceTimersByTimeAsync(600);
    expect(component.product()?.id).toBe('1');
    mockProductService.getProduct.mockReturnValue(of(MOCK_CRITICAL_PRODUCT));
    mockProductService.getOrderHistory.mockReturnValue(of([]));
    paramMapSubject.next(convertToParamMap({ id: '2' }));
    await vi.advanceTimersByTimeAsync(600);

    expect(component.product()?.id).toBe('2');
    expect(component.product()?.name).toBe('Wireless Keyboard');
    expect(component.orders()).toHaveLength(0);
    expect(component.loading()).toBe(false);
  });

  // TEST CASE 5 - Correct stock levels computed especially critical stock
  it('should compute isCriticalStock correctly based on stock level', async () => {
    createComponent();

    await vi.advanceTimersByTimeAsync(600);
    expect(component.isCriticalStock()).toBe(false); // 142 stock
    mockProductService.getProduct.mockReturnValue(of(MOCK_CRITICAL_PRODUCT));
    paramMapSubject.next(convertToParamMap({ id: '2' }));
    await vi.advanceTimersByTimeAsync(600);
    expect(component.isCriticalStock()).toBe(true); // 14 stock
  });

  // TEST CASE 6 - Retry to clear error and reload data
  it('should clear error and reload data when retry is called', async () => {
    mockProductService.getProduct.mockReturnValue(
      throwError(() => new Error('fail'))
    );
    createComponent();
    await vi.advanceTimersByTimeAsync(0);
    expect(component.error()).not.toBeNull();

    mockProductService.getProduct.mockReturnValue(of(MOCK_PRODUCT));
    mockProductService.getOrderHistory.mockReturnValue(of(MOCK_ORDERS));

    component.retry();
    await vi.advanceTimersByTimeAsync(600);
    expect(component.error()).toBeNull();
    expect(component.loading()).toBe(false);
    expect(component.product()?.id).toBe('1');
  });
});