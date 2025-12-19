
export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  STOCKMAN = 'STOCKMAN'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface AppConfig {
  uploadUrl: string; // URL of the upload script on Ubuntu server
  telegram: TelegramConfig;
}

export interface Category {
  id: string;
  name: string;
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED'
}

export enum InvoiceType {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  image?: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  sellerName: string;
  date: string;
  time: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  description?: string;
}

export type ImageSize = '1K' | '2K' | '4K';
