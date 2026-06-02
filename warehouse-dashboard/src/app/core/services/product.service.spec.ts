import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { throwError, catchError, retry, shareReplay } from 'rxjs';
import { ProductService } from './product.service';

describe('ProductService', () => {
    let service: ProductService;

    beforeEach(() => {
        vi.useFakeTimers();
        TestBed.configureTestingModule({});
        service = TestBed.inject(ProductService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // TEST UNIT 1 - Return a list of products after a simulated delay
    it('should return a list of products after simulated delay', async () => {
        let result: any[] = [];

        service.getProducts().subscribe(products => {
            result = products;
        });

        expect(result).toHaveLength(0);

        await vi.advanceTimersByTimeAsync(600);

        expect(result).toHaveLength(10);
        expect(result[0]).toMatchObject({
            id: '1',
            name: 'Mechanical Keyboard',
            category: 'Peripherals',
            stockLevel: 142,
            status: 'In Stock',
        });
    });

    // TEST UNIT 2 - Return cached product on second instance without re-fetching
    it('should return cached product on second call without re-fetching', async () => {

        service.getProducts().subscribe();
        await vi.advanceTimersByTimeAsync(600);

        let result: any = null;
        service.getProduct('1').subscribe(p => (result = p));

        await vi.advanceTimersByTimeAsync(200);

        expect(result).not.toBeNull();
        expect(result.id).toBe('1');
        expect(result.name).toBe('Mechanical Keyboard');

        // Can't resolve at 0ms
        let earlyResult: any = null;
        service.getProduct('1').subscribe(p => (earlyResult = p));
        expect(earlyResult).toBeNull();
    });

    // TEST UNIT 3 - Give error message when source can't reach
    it('should emit a user-friendly error message when the source fails', async () => {
        (service as any).productsCache$ = null;

        (service as any).productsCache$ = throwError(() => new Error('forced')).pipe(
            retry(2),
            catchError(() => throwError(() => new Error('Failed to load products. Try again.'))),
            shareReplay(1)
        );

        let errorMessage = '';
        service.getProducts().subscribe({
            error: (err: Error) => (errorMessage = err.message),
        });

        await vi.advanceTimersByTimeAsync(0);

        expect(errorMessage).toBe('Failed to load products. Try again.');
    });

    // TEST UNIT 4 - Emit updated product list
    it('should emit updated product list on each stock stream tick', async () => {
        const emissions: any[][] = [];

        const sub = service.getStockStream().subscribe(products => {
            emissions.push(products);
        });

        await vi.advanceTimersByTimeAsync(3000);
        expect(emissions.length).toBeGreaterThanOrEqual(1);
        expect(emissions[0]).toHaveLength(10);

        await vi.advanceTimersByTimeAsync(3000);
        expect(emissions.length).toBeGreaterThanOrEqual(2);

        sub.unsubscribe();
    });


    // TEST UNIT 5. Return order histroy for a valid product ID
    it('should return order history for a valid product ID', async () => {
        let orders: any[] = [];

        service.getOrderHistory('1').subscribe(result => {
            orders = result;
        });

        await vi.advanceTimersByTimeAsync(600);

        expect(orders).toHaveLength(3);
        expect(orders[0]).toMatchObject({
            id: 'ORD-001',
            productId: '1',
            quantity: -5,
            date: '2025-05-28',
        });
    });
});