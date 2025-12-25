
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

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface TelegramConfig {
  botToken: string;
  adminChatId: string;
  stockmanChatId: string;
  enabled: boolean;
}

export interface AppConfig {
  uploadUrl: string;
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
  locationUrl?: string;
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
  customerLocation?: string;
  sellerName: string;
  date: string;
  time: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  description?: string;
  isAlternativeAddress?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  alternativeLocationUrl?: string;
  shipmentImages?: string[];
  // فیلدهای جدید
  isEdited?: boolean;
  isAccountingDone?: boolean;
}

export type ImageSize = '1K' | '2K' | '4K';
