import { Product, Order, AdminSettings } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Nike Air Max 90 Sport Classic',
    category: 'Zapatillas',
    brand: 'Nike',
    sizes: ['38', '39', '40', '41', '42'],
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600'
    ],
    cost: 250,
    marginType: 'percentage',
    margin: 40, // 40% margin -> final price S/ 350
    modality: 'stock',
    leadTimeDays: 0,
    advanceType: 'percentage',
    advanceValue: 50, // S/ 175 advance
    description: 'Zapatillas urbanas de gran comodidad con amortiguación Air Max visible en el talón. Diseño icónico y durabilidad insuperable para uso diario.'
  },
  {
    id: 'prod_2',
    name: 'Adidas Tiro 23 Premium Tracksuit',
    category: 'Buzos deportivos',
    brand: 'Adidas',
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1483721310020-03333e577076?auto=format&fit=crop&q=80&w=600'
    ],
    cost: 160,
    marginType: 'fixed',
    margin: 90, // fixed S/ 90 -> final price S/ 250
    modality: 'encargo',
    leadTimeDays: 15,
    advanceType: 'percentage',
    advanceValue: 60, // 60% advance -> S/ 150 advance, S/ 100 saldo
    description: 'Buzo deportivo completo (casaca con cierre y pantalón slim fit) de tejido transpirable Aeroready. Ideal para entrenamientos de alta intensidad o comodidad casual.'
  },
  {
    id: 'prod_3',
    name: 'Puma Rider Future Vintage',
    category: 'Zapatillas',
    brand: 'Puma',
    sizes: ['37', '38', '39', '40', '41'],
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600'
    ],
    cost: 180,
    marginType: 'percentage',
    margin: 50, // 50% margin -> final S/ 270
    modality: 'stock',
    leadTimeDays: 0,
    advanceType: 'fixed',
    advanceValue: 100, // Fixed S/ 100 advance, S/ 170 saldo
    description: 'Zapatillas retro-futuristas de la famosa colección Puma Rider. Combinación de colores vibrantes con entresuela ultra amortiguada Rider Foam.'
  },
  {
    id: 'prod_4',
    name: 'Nike Academy Dry-Fit Full Set',
    category: 'Buzos deportivos',
    brand: 'Nike',
    sizes: ['XS', 'S', 'M', 'L'],
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=600'
    ],
    cost: 180,
    marginType: 'percentage',
    margin: 45, // final price S/ 261 (rounded)
    modality: 'encargo',
    leadTimeDays: 20,
    advanceType: 'percentage',
    advanceValue: 50, // 50% advance -> S/ 130.5
    description: 'Conjunto deportivo confeccionado en poliéster reciclado de tecnología Dry-Fit para mantener la piel fresca y seca durante el ejercicio. Bolsillos con cierre.'
  },
  {
    id: 'prod_5',
    name: 'New Balance 574 Sport Tech',
    category: 'Zapatillas',
    brand: 'New Balance',
    sizes: ['39', '40', '41', '42', '43'],
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600'
    ],
    cost: 210,
    marginType: 'fixed',
    margin: 110, // final price S/ 320
    modality: 'stock',
    leadTimeDays: 0,
    advanceType: 'percentage',
    advanceValue: 50, // S/ 160 advance
    description: 'Modelo clásico de la marca con entresuela de espuma EVA de doble densidad y soporte ENCAP en el talón. Máximo soporte y comodidad clásica.'
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1',
    date: '2026-06-28T10:15:00Z',
    clientName: 'Alejandro Rivera',
    clientPhone: '987654321',
    items: [
      {
        productId: 'prod_1',
        productName: 'Nike Air Max 90 Sport Classic',
        productBrand: 'Nike',
        productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
        sizeSelected: '41',
        quantity: 1,
        pricePerUnit: 350,
        advancePerUnit: 175
      }
    ],
    totalPrice: 350,
    advanceRequired: 175,
    balanceDue: 175,
    paymentStatus: 'adelanto_pagado',
    deliveryStatus: 'pendiente',
    notes: 'Reservado con adelanto de S/175 vía Yape. Entrega pendiente en San Miguel.'
  },
  {
    id: 'ord_2',
    date: '2026-06-25T15:30:00Z',
    clientName: 'Carla Mendoza',
    clientPhone: '912345678',
    items: [
      {
        productId: 'prod_2',
        productName: 'Adidas Tiro 23 Premium Tracksuit',
        productBrand: 'Adidas',
        productImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
        sizeSelected: 'M',
        quantity: 1,
        pricePerUnit: 250,
        advancePerUnit: 150
      }
    ],
    totalPrice: 250,
    advanceRequired: 150,
    balanceDue: 100,
    paymentStatus: 'saldo_pendiente',
    deliveryStatus: 'en_camino',
    notes: 'Por encargo de 15 días. Pedido ya se encuentra en aduanas Lima. Cliente pagó adelanto.'
  },
  {
    id: 'ord_3',
    date: '2026-06-20T09:00:00Z',
    clientName: 'Mateo Quispe',
    clientPhone: '998877665',
    items: [
      {
        productId: 'prod_3',
        productName: 'Puma Rider Future Vintage',
        productBrand: 'Puma',
        productImage: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=600',
        sizeSelected: '40',
        quantity: 1,
        pricePerUnit: 270,
        advancePerUnit: 100
      }
    ],
    totalPrice: 270,
    advanceRequired: 100,
    balanceDue: 170,
    paymentStatus: 'completado',
    deliveryStatus: 'entregado',
    notes: 'Entregado en Estación Angamos. Canceló la totalidad vía Plin.'
  }
];

export const DEFAULT_SETTINGS: AdminSettings = {
  whatsappNumber: '51987654321', // Código de Perú + número de ejemplo
  companyName: 'Tabitas Store',
  yapeNumber: '987654321',
  yapeName: 'Tabitas E.I.R.L.',
  plinNumber: '912345678',
  plinName: 'Juan Pérez',
  advanceTypeRule: 'flat',
  flatAdvanceAmount: 35,
};
