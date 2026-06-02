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

});