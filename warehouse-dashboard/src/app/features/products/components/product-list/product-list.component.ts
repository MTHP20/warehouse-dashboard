import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, merge, Observable, startWith } from 'rxjs';
import { Product } from '../../../../core/models/product.model';
import { AsyncPipe } from '@angular/common';

type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-product-list',
  imports: [
    ReactiveFormsModule,
    AsyncPipe
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  categoryFilter = new FormControl('');
  statusFilter = new FormControl('');
  currentSort: SortOrder = 'asc';

  private sortOrder$ = new BehaviorSubject<SortOrder>('asc');
  private products$!: Observable<Product[]>;
  filteredProducts$!: Observable<Product[]>;

  constructor(
    private router: Router,
    private productService: ProductService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.products$ = merge(
      this.productService.getProducts(),
      this.productService.getStockStream()
    );

    this.filteredProducts$ = combineLatest([
      this.products$,
      this.categoryFilter.valueChanges.pipe(startWith('')),
      this.statusFilter.valueChanges.pipe(startWith('')),
      this.sortOrder$
    ]).pipe(
      map(([products, category, status, sort]) =>
        this.applyFilterAndSort(products, category ?? '', status ?? '', sort)
      )
    );
  }

  toggleSort(): void {
    const next: SortOrder = this.currentSort === 'asc' ? 'desc' : 'asc';
    this.currentSort = next;
    this.sortOrder$.next(next);
  }

  goToProduct(product: Product): void {
    this.router.navigate([product.id], { relativeTo: this.route });
  }

  private applyFilterAndSort(products: Product[], category: string, status: string, sort: SortOrder): Product[] {
    return products
      .filter(p => category ? p.category === category : true)
      .filter(p => status ? p.status === status : true)
      .sort((a, b) =>
        sort === 'asc'
          ? a.stockLevel - b.stockLevel
          : b.stockLevel - a.stockLevel
      );
  }

}
