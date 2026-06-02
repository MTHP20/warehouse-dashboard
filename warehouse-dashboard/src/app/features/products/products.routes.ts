import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/products-page/products-page.component').then(
        m => m.ProductsPageComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/product-list/product-list.component').then(
            m => m.ProductListComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./components/product-detail/product-detail.component').then(
            m => m.ProductDetailComponent
          ),
      },
    ],
  },
];