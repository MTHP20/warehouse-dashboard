import { Component, computed, effect, signal } from '@angular/core';
import { Order, Product } from '../../../../core/models/product.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { catchError, EMPTY, forkJoin, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-product-detail',
  imports: [MatIconModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  // Signal for local state
  product = signal<Product | null>(null);
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  isCriticalStock = computed(() =>
    (this.product()?.stockLevel ?? 0) < 20
  );

  stockLabel = computed(() => {
    const level = this.product()?.stockLevel ?? 0;
    if (level === 0) {
      return 'Out of Stock';
    }
    if (level < 20) return 'Low Stock';
    return 'In Stock';
  })

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {
    // React to product signal change
    effect(() => {
      const p = this.product();
      if (p) {
        console.log(`Viewing ${p.name}, with stock: ${p.stockLevel}`)
      }
    })

    // Route Param
    this.route.paramMap.pipe(
      map(params => params.get('id')!),
      switchMap(id => {
        this.loading.set(true);
        this.error.set(null);

        return forkJoin({
          product: this.productService.getProduct(id),
          orders: this.productService.getOrderHistory(id)
        }).pipe(
          catchError(err => {
            this.error.set('Unable to load product details. Try again.');
            this.loading.set(false);
            return EMPTY;
          })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(({ product, orders }) => {
      this.product.set(product);
      this.orders.set(orders);
      this.loading.set(false);
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  retry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      product: this.productService.getProduct(id),
      orders: this.productService.getOrderHistory(id)
    }).pipe(
      catchError(err => {
        this.error.set('Unable to load product details. Please try again.');
        this.loading.set(false);
        return EMPTY;
      })
    ).subscribe(({ product, orders }) => {
      this.product.set(product);
      this.orders.set(orders);
      this.loading.set(false);
    });
  }
}


