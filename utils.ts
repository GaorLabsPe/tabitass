import { Product, AdminSettings } from './types';

/**
 * Calculates the final public selling price for a product based on cost and margin.
 */
export function calculateFinalPrice(product: Product): number {
  if (product.marginType === 'percentage') {
    return Math.round(product.cost + (product.cost * product.margin / 100));
  } else {
    return Math.round(product.cost + product.margin);
  }
}

/**
 * Calculates the required advance payment (adelanto) to reserve a product.
 */
export function calculateAdvance(product: Product, finalPrice: number, settings?: AdminSettings): number {
  if (settings && settings.advanceTypeRule === 'flat') {
    return Math.min(settings.flatAdvanceAmount, finalPrice);
  }
  if (product.advanceType === 'percentage') {
    return Math.round(finalPrice * product.advanceValue / 100);
  } else {
    return Math.min(product.advanceValue, finalPrice);
  }
}

/**
 * Formats a number into Peruvian Soles (e.g., "S/ 350")
 */
export function formatCurrency(amount: number): string {
  return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Generates the WhatsApp API click-to-chat link prefilled with order details.
 */
export function getWhatsAppUrl(
  whatsappNumber: string,
  productName: string,
  productBrand: string,
  selectedSize: string,
  finalPrice: number,
  advanceRequired: number,
  balanceDue: number,
  modality: 'stock' | 'encargo'
): string {
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const message = `¡Hola Tabitas! 👋 Me interesa comprar este producto:\n\n` +
    `👟 *${productName}*\n` +
    `🏷️ Marca: ${productBrand}\n` +
    `📏 Talla: ${selectedSize}\n` +
    `💰 Precio: ${formatCurrency(finalPrice)}\n` +
    `📌 Disponibilidad: ${modality === 'stock' ? 'Disponible ya' : 'Por encargo'}\n` +
    `💳 Adelanto de reserva: ${formatCurrency(advanceRequired)}\n` +
    `🤝 Saldo a pagar: ${formatCurrency(balanceDue)}\n\n` +
    `*📸 En breve enviaré la imagen/captura del pago del adelanto.*\n\n` +
    `¿Me confirmas disponibilidad por favor? ¡Gracias!`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates the WhatsApp API click-to-chat link prefilled with cart order details.
 */
export function getCartWhatsAppUrl(
  whatsappNumber: string,
  items: {
    productName: string;
    productBrand: string;
    sizeSelected: string;
    quantity: number;
    pricePerUnit: number;
    advancePerUnit: number;
    modality: 'stock' | 'encargo';
  }[],
  totalPrice: number,
  advanceRequired: number,
  balanceDue: number,
  clientName?: string,
  clientPhone?: string,
  shippingType?: 'huancayo' | 'provincia',
  shippingAddress?: string
): string {
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  let itemsText = '';
  items.forEach((item, index) => {
    const subtotal = item.pricePerUnit * item.quantity;
    itemsText += `👟 *${index + 1}. ${item.productName}*\n` +
      `   🏷️ Marca: ${item.productBrand}\n` +
      `   📏 Talla: *${item.sizeSelected}*\n` +
      `   🔢 Cantidad: *x${item.quantity}*\n` +
      `   💰 Subtotal: ${formatCurrency(subtotal)}\n` +
      `   📌 Tipo: ${item.modality === 'stock' ? 'Disponible ya' : 'Por encargo'}\n\n`;
  });

  const clientHeader = clientName 
    ? `👤 *Cliente:* ${clientName}\n📞 *Celular:* ${clientPhone || '-'}\n`
    : '';

  let shippingLabel = 'Huancayo (Preferencia)';
  if (shippingType === 'provincia') {
    shippingLabel = 'Otras Provincias';
  }

  const shippingText = shippingType
    ? `📍 *Tipo de Envío:* ${shippingLabel}\n` +
      (shippingAddress ? `🏠 *Dirección/Datos:* ${shippingAddress}\n` : '')
    : '';

  const paymentNotice = `📸 *Nota:* En breve enviaré la imagen/captura de pantalla de mi pago del adelanto.`;

  const message = `¡Hola Tabitas! 👋 Aquí tienes mi pedido del carrito web:\n\n` +
    clientHeader +
    shippingText +
    `\n🛒 *DETALLE DEL PEDIDO:*\n` +
    `-----------------------------------------\n` +
    itemsText +
    `-----------------------------------------\n` +
    `💵 *RESUMEN DE PAGO:*\n` +
    `💰 Total General: *${formatCurrency(totalPrice)}*\n` +
    `💳 Adelanto Seleccionado: *${formatCurrency(advanceRequired)}*\n` +
    `🤝 Saldo al Recibir: *${formatCurrency(balanceDue)}*\n\n` +
    `${paymentNotice}\n\n` +
    `¿Me confirman disponibilidad para reservarlo? ¡Gracias!`;

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}
