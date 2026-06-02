import { Injectable } from '@angular/core';
import { Product, Order } from '../models/product.model';
import { BehaviorSubject, catchError, delay, interval, Observable, of, retry, shareReplay, switchMap, tap, throwError } from 'rxjs';

// MOCK DATA
const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Mechanical Keyboard', category: 'Peripherals', stockLevel: 142, status: 'In Stock' },
  { id: '2', name: 'Wireless Keyboard', category: 'Peripherals', stockLevel: 14, status: 'Low Stock' },
  { id: '3', name: 'USB Hub 7-Port', category: 'Electronics', stockLevel: 0, status: 'Out of Stock' },
  { id: '4', name: '27" Monitor', category: 'Electronics', stockLevel: 67, status: 'In Stock' },
  { id: '5', name: 'External SSD 1TB', category: 'Storage', stockLevel: 8, status: 'Low Stock' },
  { id: '6', name: 'Webcam HD', category: 'Electronics', stockLevel: 34, status: 'In Stock' },
  { id: '7', name: 'Mouse Pad XL', category: 'Peripherals', stockLevel: 55, status: 'In Stock' },
  { id: '8', name: 'HDMI Cable 2m', category: 'Electronics', stockLevel: 3, status: 'Low Stock' },
  { id: '9', name: 'Gaming Mouse RGB', category: 'Peripherals', stockLevel: 96, status: 'In Stock' },
  { id: '10', name: 'Laptop Stand Adjustable', category: 'Accessories', stockLevel: 11, status: 'Low Stock' },
];

const MOCK_ORDERS: Record<string, Order[]> = {
  '1': [
    { id: 'ORD-001', productId: '1', quantity: -5, date: '2025-05-28' },
    { id: 'ORD-002', productId: '1', quantity: 50, date: '2025-05-10' },
    { id: 'ORD-003', productId: '1', quantity: -8, date: '2025-05-30' },
  ],
  '2': [
    { id: 'ORD-004', productId: '2', quantity: -12, date: '2025-05-21' },
    { id: 'ORD-005', productId: '2', quantity: -5, date: '2025-05-28' },
    { id: 'ORD-006', productId: '2', quantity: 50, date: '2025-05-10' },
    { id: 'ORD-007', productId: '2', quantity: -19, date: '2025-05-31' },
  ],
  '3': [
    { id: 'ORD-008', productId: '3', quantity: -19, date: '2025-04-02' },
    { id: 'ORD-009', productId: '3', quantity: -8, date: '2025-05-01' },
  ],
  '4': [
    { id: 'ORD-010', productId: '4', quantity: 30, date: '2025-05-03' },
    { id: 'ORD-011', productId: '4', quantity: -6, date: '2025-05-14' },
    { id: 'ORD-012', productId: '4', quantity: -9, date: '2025-05-27' },
  ],
  '5': [
    { id: 'ORD-013', productId: '5', quantity: 20, date: '2025-05-01' },
    { id: 'ORD-014', productId: '5', quantity: -7, date: '2025-05-20' },
    { id: 'ORD-015', productId: '5', quantity: -5, date: '2025-05-29' },
  ],
  '6': [
    { id: 'ORD-016', productId: '6', quantity: 40, date: '2025-05-05' },
    { id: 'ORD-017', productId: '6', quantity: -10, date: '2025-05-18' },
  ],
  '7': [
    { id: 'ORD-018', productId: '7', quantity: 60, date: '2025-05-02' },
    { id: 'ORD-019', productId: '7', quantity: -12, date: '2025-05-25' },
  ],
  '8': [
    { id: 'ORD-020', productId: '8', quantity: 25, date: '2025-05-07' },
    { id: 'ORD-021', productId: '8', quantity: -11, date: '2025-05-29' },
    { id: 'ORD-022', productId: '8', quantity: -9, date: '2025-05-31' },
  ],
  '9': [
    { id: 'ORD-023', productId: '9', quantity: 100, date: '2025-05-04' },
    { id: 'ORD-024', productId: '9', quantity: -15, date: '2025-05-22' },
    { id: 'ORD-025', productId: '9', quantity: -9, date: '2025-05-30' },
  ],
  '10': [
    { id: 'ORD-026', productId: '10', quantity: 25, date: '2025-05-06' },
    { id: 'ORD-027', productId: '10', quantity: -7, date: '2025-05-23' },
    { id: 'ORD-028', productId: '10', quantity: -7, date: '2025-05-30' },
  ],
};

function getStatus(stockLevel: number): Product['status'] {
  if (stockLevel === 0) return 'Out of Stock';
  if (stockLevel < 20) return 'Low Stock';
  return 'In Stock';
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productCache = new Map<string, Product>();
  private productsCache$: Observable<Product[]> | null = null;

  private stockSubject$ = new BehaviorSubject<Product[]>([...MOCK_PRODUCTS]);
  private stockStream$ = interval(3000).pipe(
    tap(() => this.simulateStockInventoryChange()),
    switchMap(() => of(this.stockSubject$.getValue())),
    shareReplay(1)
  );

  getProducts(): Observable<Product[]> {
    if (this.productsCache$) {
      return this.productsCache$;
    }

    this.productsCache$ = of([...MOCK_PRODUCTS]).pipe(
      delay(600),
      retry(2),
      catchError(() => throwError(() => new Error('Failed to load products. Try again.'))),
      tap(products => products.forEach(p => this.productCache.set(p.id, p))),
      shareReplay(1)
    );

    return this.productsCache$
  }

  getProduct(id: string) {
    const isCached = this.productCache.get(id);
    if (isCached) {
      return of(isCached).pipe(delay(200));
    }

    const product = MOCK_PRODUCTS.find(item => item.id === id);
    if (!product) {
      return throwError(() => new Error('Failed to find product.'))
    }

    return of({ ...product }).pipe(
      delay(600),
      retry(2),
      catchError(() => throwError(() => new Error('Failed to load product. Try again.'))),
      tap(item => this.productCache.set(item.id, item)),
    )
  }
  
  getStockStream(): Observable<Product[]> {
    return this.stockStream$;
  }

  // Simulate Stock Changes within the Mock Data
  private simulateStockInventoryChange(): void {
    const current = this.stockSubject$.getValue();
    const updated = current.map(product => {
      const shouldUpdate = Math.random() > 0.6;
      if (!shouldUpdate) return product;

      const change = Math.floor(Math.random() * 10) - 5;
      const newLevel = Math.max(0, product.stockLevel + change);
      const newStatus = getStatus(newLevel);

      if (newStatus !== product.status && (newStatus === 'Low Stock' || newStatus === 'Out of Stock')) {
        console.log(`${product.name} is now ${newStatus}`);
      }

      return { ...product, stockLevel: newLevel, status: newStatus };
    });

    this.stockSubject$.next(updated);
  }

}
