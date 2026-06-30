export interface Product {
  id: string;
  name: string;
  category: 'Zapatillas' | 'Buzos deportivos';
  brand: string;
  sizes: string[];
  images: string[];
  cost: number;
  marginType: 'percentage' | 'fixed';
  margin: number;
  modality: 'stock' | 'encargo';
  leadTimeDays: number; // For "por encargo"
  advanceType: 'percentage' | 'fixed';
  advanceValue: number;
  description: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productBrand: string;
  productImage: string;
  sizeSelected: string;
  quantity: number;
  pricePerUnit: number;
  advancePerUnit: number;
}

export interface Order {
  id: string;
  date: string;
  clientName: string;
  clientPhone: string;
  clientType?: 'general' | 'trusted'; // 'general' = regular, 'trusted' = conocido/trabajo (sin adelanto)
  shippingType?: 'huancayo' | 'provincia'; // 'huancayo' = Huancayo, 'provincia' = Otras Provincias
  shippingAddress?: string; // Dirección o datos del envío a provincias / Lima
  items: OrderItem[];
  totalPrice: number;
  advanceRequired: number;
  balanceDue: number;
  paymentStatus: 'adelanto_pagado' | 'saldo_pendiente' | 'completado';
  deliveryStatus: 'pendiente' | 'en_camino' | 'entregado' | 'cancelado';
  notes?: string;
}

export interface CartItem {
  id: string; // Composite of productId-sizeSelected
  product: Product;
  sizeSelected: string;
  quantity: number;
}

export interface AdminSettings {
  whatsappNumber: string; // e.g. "51987654321" (Peru code 51 + number)
  companyName: string;
  yapeNumber: string;
  yapeName: string;
  plinNumber: string;
  plinName: string;
  advanceTypeRule: 'calculated' | 'flat'; // 'calculated' = por producto, 'flat' = monto fijo general
  flatAdvanceAmount: number; // e.g. 35 soles
}
