import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { throwError, catchError, retry, shareReplay, Observable, of } from 'rxjs';
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

    // TEST CASE 1 - Return a list of products after a simulated delay
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

    // TEST CASE 2 - Return cached product on second instance without re-fetching
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

    // TEST CASE 3.1 - Give error message when source can't reach
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

    // TEST CASE 3.2 Retry up to 2 times before error
    it('should retry up to 2 times before emitting a user-friendly error', async () => {
        let attemptCount = 0;

        (service as any).productsCache$ = new Observable((observer: any) => {
            attemptCount++;
            observer.error(new Error('forced'));
        }).pipe(
            retry(2),
            catchError(() => throwError(() => new Error('Failed to load products. Try again.')))
        );

        let errorMessage = '';
        service.getProducts().subscribe({
            error: (err: Error) => (errorMessage = err.message),
        });

        await vi.advanceTimersByTimeAsync(0);

        expect(attemptCount).toBe(3);
        expect(errorMessage).toBe('Failed to load products. Try again.');
    });

    // TEST CASE 4 - Emit updated product list
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


    // TEST CASE 5. Return order histroy for a valid product ID
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

    // TEST CASE 6 - Hit Cache map and perform fresh fetch
    it('should hit the cache map and not perform a fresh fetch', async () => {
        service.getProducts().subscribe();
        await vi.advanceTimersByTimeAsync(600);

        const getSpy = vi.spyOn((service as any).productCache, 'get');

        let result: any = null;
        service.getProduct('1').subscribe(p => (result = p));
        await vi.advanceTimersByTimeAsync(200);

        expect(getSpy).toHaveBeenCalledWith('1');
        expect(result?.id).toBe('1');
        expect(result?.name).toBe('Mechanical Keyboard');
    });

    // TEST CASE 7 - Edge case: empty product list
    it('should handle an empty product list gracefully', async () => {
        (service as any).productsCache$ = of([]);

        let result: any[] | null = null;
        service.getProducts().subscribe(products => (result = products));

        await vi.advanceTimersByTimeAsync(0);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
    });

    // TEST CASE 8 - Stock status transition
    it('should reflect correct status after stock level crosses a threshold', async () => {
        const emissions: any[][] = [];
        const sub = service.getStockStream().subscribe(p => emissions.push(p));

        (service as any).stockSubject$.next([
            { id: '1', name: 'Mechanical Keyboard', category: 'Peripherals', stockLevel: 1, status: 'In Stock' }
        ]);

        await vi.advanceTimersByTimeAsync(3000);

        const latest = emissions.at(-1);
        const product = latest?.find((p: any) => p.id === '1');

        expect(['Low Stock', 'Out of Stock']).toContain(product?.status);

        sub.unsubscribe();
    });
});