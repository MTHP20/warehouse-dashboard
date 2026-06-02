import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Router } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { ProductListComponent } from './product-list.component';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Mechanical Keyboard', category: 'Peripherals', stockLevel: 142, status: 'In Stock' },
    { id: '2', name: 'Wireless Keyboard', category: 'Peripherals', stockLevel: 14, status: 'Low Stock' },
    { id: '3', name: 'USB Hub 7-Port', category: 'Electronics', stockLevel: 0, status: 'Out of Stock' },
    { id: '4', name: '27" Monitor', category: 'Electronics', stockLevel: 67, status: 'In Stock' },
];

describe('ProductListComponent', () => {
    let component: ProductListComponent;
    let mockProductService: { getProducts: ReturnType<typeof vi.fn>; getStockStream: ReturnType<typeof vi.fn> };
    let mockRouter: { navigate: ReturnType<typeof vi.fn> };
    let stockSubject: BehaviorSubject<Product[]>;

    beforeEach(() => {
        vi.useFakeTimers();

        stockSubject = new BehaviorSubject<Product[]>(MOCK_PRODUCTS);

        mockProductService = {
            getProducts: vi.fn().mockReturnValue(of(MOCK_PRODUCTS)),
            getStockStream: vi.fn().mockReturnValue(stockSubject.asObservable()),
        };

        mockRouter = {
            navigate: vi.fn(),
        };

        TestBed.configureTestingModule({
            imports: [ProductListComponent],
            providers: [
                { provide: ProductService, useValue: mockProductService },
                { provide: Router, useValue: mockRouter },
            ],
        });

        const fixture = TestBed.createComponent(ProductListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // TEST UNIT 1 - Render all products on an inital load
    it('should render all products on initial load', async () => {
        const results: Product[][] = [];

        component.filteredProducts$.subscribe(products => results.push(products));

        await vi.advanceTimersByTimeAsync(0);

        expect(results[0]).toHaveLength(4);
        expect(results[0][0].name).toBe('USB Hub 7-Port');
    });

    // TEST UNIT 2 - Filter products by category
    it('should filter products by category without a button press', async () => {
        const results: Product[][] = [];

        component.filteredProducts$.subscribe(products => results.push(products));
        component.categoryFilter.setValue('Electronics');

        await vi.advanceTimersByTimeAsync(0);

        const last = results[results.length - 1];
        expect(last.every(p => p.category === 'Electronics')).toBe(true);
        expect(last).toHaveLength(2);
    });

    // TEST UNIT 3 - Filter products by status
    it('should filter products by status without a button press', async () => {
        const results: Product[][] = [];

        component.filteredProducts$.subscribe(products => results.push(products));
        component.statusFilter.setValue('Low Stock');

        await vi.advanceTimersByTimeAsync(0);

        const last = results[results.length - 1];
        expect(last.every(p => p.status === 'Low Stock')).toBe(true);
        expect(last).toHaveLength(1);
    });

    // TEST UNIT 4 - Sort the stock ascending and vice versa
    it('should toggle sort between ascending and descending stock level', async () => {
        const results: Product[][] = [];

        component.filteredProducts$.subscribe(products => results.push(products));
        await vi.advanceTimersByTimeAsync(0);

        const asc = results[results.length - 1];
        expect(asc[0].stockLevel).toBeLessThanOrEqual(asc[asc.length - 1].stockLevel);

        component.toggleSort();
        await vi.advanceTimersByTimeAsync(0);

        const desc = results[results.length - 1];
        expect(desc[0].stockLevel).toBeGreaterThanOrEqual(desc[desc.length - 1].stockLevel);
        expect(component.currentSort).toBe('desc');
    });

    // TEST UNIT 5 - Show empty state when filters cannot apply
    it('should return empty list when no products match the active filters', async () => {
        const results: Product[][] = [];

        component.filteredProducts$.subscribe(products => results.push(products));
        component.categoryFilter.setValue('Storage');

        await vi.advanceTimersByTimeAsync(0);

        expect(results[results.length - 1]).toHaveLength(0);
    });

    // TEST UNIT 6 - Jump to product with query parameter (ID)
    it('should navigate to product detail with query param when a row is clicked', () => {
        component.goToProduct(MOCK_PRODUCTS[0]);

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ['/products'],
            { queryParams: { id: '1' } }
        );
    });

    // TEST UNIT 7 - List updated and displayed within real time
    it('should reflect real-time stock updates when the stream emits new data', async () => {
        mockProductService.getProducts.mockReturnValue(stockSubject.asObservable());

        const fixture = TestBed.createComponent(ProductListComponent);
        const liveComponent = fixture.componentInstance;
        fixture.detectChanges();

        const results: Product[][] = [];
        liveComponent.filteredProducts$.subscribe(products => results.push(products));

        await vi.advanceTimersByTimeAsync(0);
        const before = results[results.length - 1].find(p => p.id === '1')!.stockLevel;

        const updated = MOCK_PRODUCTS.map(p =>
            p.id === '1' ? { ...p, stockLevel: 5, status: 'Low Stock' as const } : p
        );
        stockSubject.next(updated);

        await vi.advanceTimersByTimeAsync(0);
        const after = results[results.length - 1].find(p => p.id === '1')!.stockLevel;

        expect(after).not.toBe(before);
        expect(after).toBe(5);
    });
});