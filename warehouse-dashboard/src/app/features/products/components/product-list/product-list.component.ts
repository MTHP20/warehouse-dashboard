import { Component, inject } from '@angular/core';
import { ProductService } from '../../../../core/services/product.service';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';

type sortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-product-list',
  imports: [],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  private router = inject(Router);
  private productService = inject(ProductService);

  categoryFilter = new FormControl('');
  statusFilter = new FormControl('');

  private sortOrder$ = new BehaviorSubject<sortOrder>('asc');
  currentSort: sortOrder = 'asc';

  private products = this.productService.getProducts();

  // filteredProducts$ = combineLatest([
  //   this.productService.getProducts(),
  //   this.categoryFilter.valueChanges.pipe(startWith('')),
  //   this.statusFilter.valueChanges.pipe(startWith('')),
  //   this.sortOrder$
  // ]).pipe(
  //   map(([products, category, status, sort]) =>
  //     this.applyFiltersAndSort(products, category ?? '', status ?? '', sort)
  //   )
  // );


}
