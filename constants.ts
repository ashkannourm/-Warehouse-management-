
import { User, UserRole, Product, Customer, Invoice, Category } from './types';

// Plain text passwords as requested: "Admin", "Seller", "Warehouse"
export const INITIAL_USERS: User[] = [
  { id: '1', name: 'مدیر سیستم', username: 'Admin', password: 'Admin', role: UserRole.ADMIN },
  { id: '2', name: 'کارشناس فروش', username: 'Seller', password: 'Seller', role: UserRole.SALES },
  { id: '3', name: 'انباردار', username: 'Warehouse', password: 'Warehouse', role: UserRole.STOCKMAN },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'قطعات کامپیوتر' },
  { id: 'cat2', name: 'لوازم جانبی' },
  { id: 'cat3', name: 'تجهیزات شبکه' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1001', name: 'مانیتور سامسونگ ۲۴ اینچ', category: 'قطعات کامپیوتر', stock: 50, unit: 'عدد' },
  { id: '1002', name: 'کیبورد مکانیکی لاجیتک', category: 'لوازم جانبی', stock: 120, unit: 'عدد' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'شرکت فناوران نوین', phone: '021-12345678', address: 'تهران، خیابان ولیعصر' },
  { id: 'c2', name: 'فروشگاه دیجی‌شاپ', phone: '021-87654321', address: 'تهران، سعادت آباد' },
];

export const INITIAL_INVOICES: Invoice[] = [];
