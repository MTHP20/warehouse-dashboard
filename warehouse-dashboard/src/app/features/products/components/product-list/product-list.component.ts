import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, merge, Observable, startWith } from 'rxjs';
import { Product } from '../../../../core/models/product.model';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatOption } from '@angular/material/autocomplete';

type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-product-list',
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    MatProgressSpinnerModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    DecimalPipe,
    MatTableModule,
    MatFormFieldModule,
    MatOption
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent implements OnInit {
  searchFilter = new FormControl('');
  categoryFilter = new FormControl('');
  statusFilter = new FormControl('');
  currentSort: SortOrder = 'asc';

  private sortOrder$ = new BehaviorSubject<SortOrder>('asc');
  private products$!: Observable<Product[]>;
  filteredProducts$!: Observable<Product[]>;

  totalProducts$!: Observable<number>;
  inStock$!: Observable<number>;
  lowStock$!: Observable<number>;
  outOfStock$!: Observable<number>;

  displayedColumns = ['name', 'category', 'stockLevel', 'status'];

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
      this.searchFilter.valueChanges.pipe(startWith('')),
      this.sortOrder$
    ]).pipe(
      map(([products, category, status, search, sort]) =>
        this.applyFilterAndSort(products, category ?? '', status ?? '', search ?? '', sort)
      )
    );

    this.totalProducts$ = this.products$.pipe(map(p => p.length));
    this.inStock$ = this.products$.pipe(map(p => p.filter(x => x.status === 'In Stock').length));
    this.lowStock$ = this.products$.pipe(map(p => p.filter(x => x.status === 'Low Stock').length));
    this.outOfStock$ = this.products$.pipe(map(p => p.filter(x => x.status === 'Out of Stock').length));
  }

  toggleSort(): void {
    const next: SortOrder = this.currentSort === 'asc' ? 'desc' : 'asc';
    this.currentSort = next;
    this.sortOrder$.next(next);
  }

  goToProduct(product: Product): void {
    this.router.navigate([product.id], { relativeTo: this.route });
  }

  private applyFilterAndSort(products: Product[], category: string, status: string, search: string, sort: SortOrder): Product[] {
    return products
      .filter(p => category ? p.category === category : true)
      .filter(p => status ? p.status === status : true)
      .filter(p => search ? p.name.toLowerCase().includes(search.toLowerCase()) : true)
      .sort((a, b) =>
        sort === 'asc'
          ? a.stockLevel - b.stockLevel
          : b.stockLevel - a.stockLevel
      );
  }

}
