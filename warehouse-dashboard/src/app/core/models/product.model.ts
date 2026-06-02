export interface Product {
    id: string;
    name: string;
    category: string;
    stockLevel: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Order {
    id: string;
    productId: string;
    quantity: number;
    date: string;
}