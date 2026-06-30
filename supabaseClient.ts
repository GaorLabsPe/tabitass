import { createClient } from '@supabase/supabase-js';
import { Product, Order, AdminSettings } from './types';

// Obtener variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar si las credenciales están configuradas
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('tu-proyecto')
);

// Crear el cliente de Supabase con el esquema 'tabitass'
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'tabitass',
      },
    })
  : null;

// =========================================================================
// MAPPERS PARA TRADUCIR DE SNAKE_CASE (BASE DE DATOS) A CAMELCASE (REACT)
// =========================================================================

function mapDbProductToApp(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    brand: p.brand,
    sizes: Array.isArray(p.sizes) ? p.sizes : JSON.parse(p.sizes || '[]'),
    images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
    cost: Number(p.cost || 0),
    marginType: p.margin_type || p.marginType || 'percentage',
    margin: Number(p.margin || 0),
    modality: p.modality || 'stock',
    leadTimeDays: Number(p.lead_time_days !== undefined ? p.lead_time_days : p.leadTimeDays || 0),
    advanceType: p.advance_type || p.advanceType || 'percentage',
    advanceValue: Number(p.advance_value !== undefined ? p.advance_value : p.advanceValue || 0),
    description: p.description || '',
  };
}

function mapAppProductToDb(product: Product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    sizes: product.sizes,
    images: product.images,
    cost: product.cost,
    margin_type: product.marginType,
    margin: product.margin,
    modality: product.modality,
    lead_time_days: product.leadTimeDays,
    advance_type: product.advanceType,
    advance_value: product.advanceValue,
    description: product.description,
  };
}

function mapDbOrderToApp(o: any): Order {
  return {
    id: o.id,
    date: o.date,
    clientName: o.client_name || o.clientName || '',
    clientPhone: o.client_phone || o.clientPhone || '',
    clientType: o.client_type || o.clientType || 'general',
    shippingType: o.shipping_type || o.shippingType || 'huancayo',
    shippingAddress: o.shipping_address || o.shippingAddress || '',
    items: Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]'),
    totalPrice: Number(o.total_price !== undefined ? o.total_price : o.totalPrice || 0),
    advanceRequired: Number(o.advance_required !== undefined ? o.advance_required : o.advanceRequired || 0),
    balanceDue: Number(o.balance_due !== undefined ? o.balance_due : o.balanceDue || 0),
    paymentStatus: o.payment_status || o.paymentStatus || 'pendiente',
    deliveryStatus: o.delivery_status || o.deliveryStatus || 'pendiente',
    notes: o.notes || '',
  };
}

function mapAppOrderToDb(order: Order) {
  return {
    id: order.id,
    date: order.date,
    client_name: order.clientName,
    client_phone: order.clientPhone,
    client_type: order.clientType || 'general',
    shipping_type: order.shippingType || 'huancayo',
    shipping_address: order.shippingAddress || '',
    items: order.items,
    total_price: order.totalPrice,
    advance_required: order.advanceRequired,
    balance_due: order.balanceDue,
    payment_status: order.paymentStatus,
    delivery_status: order.deliveryStatus,
    notes: order.notes || '',
  };
}

function mapDbSettingsToApp(data: any): AdminSettings {
  return {
    whatsappNumber: data.whatsapp_number || data.whatsappNumber || '',
    companyName: data.company_name || data.companyName || 'Tabitas Store',
    yapeNumber: data.yape_number || data.yapeNumber || '',
    yapeName: data.yape_name || data.yapeName || '',
    plinNumber: data.plin_number || data.plinNumber || '',
    plinName: data.plin_name || data.plinName || '',
    advanceTypeRule: data.advance_type_rule || data.advanceTypeRule || 'percentage',
    flatAdvanceAmount: Number(data.flat_advance_amount !== undefined ? data.flat_advance_amount : data.flatAdvanceAmount || 0),
  };
}

function mapAppSettingsToDb(settings: AdminSettings) {
  return {
    id: 'default',
    whatsapp_number: settings.whatsappNumber,
    company_name: settings.companyName,
    yape_number: settings.yapeNumber,
    yape_name: settings.yapeName,
    plin_number: settings.plinNumber,
    plin_name: settings.plinName,
    advance_type_rule: settings.advanceTypeRule,
    flat_advance_amount: settings.flatAdvanceAmount,
  };
}

/**
 * Sincroniza y obtiene todos los productos desde Supabase.
 * Si falla o no está configurado, retorna null (para usar localStorage).
 */
export async function getProductsDb(): Promise<Product[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase: La tabla "products" no responde. Ejecuta el script SQL en tu panel de Supabase.', error);
      return null;
    }

    return (data || []).map(mapDbProductToApp);
  } catch (err) {
    console.warn('Supabase: Fallo de conexión.', err);
    return null;
  }
}

/**
 * Guarda o actualiza un producto en Supabase.
 */
export async function saveProductDb(product: Product): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbPayload = mapAppProductToDb(product);

    const { error } = await supabase
      .from('products')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase: No se pudo guardar el producto. Verifica la tabla "products".', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase: Error al guardar producto.', err);
    return false;
  }
}

/**
 * Elimina un producto de Supabase.
 */
export async function deleteProductDb(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase: No se pudo eliminar el producto.', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase: Error al eliminar producto.', err);
    return false;
  }
}

/**
 * Sincroniza y obtiene todos los pedidos desde Supabase.
 */
export async function getOrdersDb(): Promise<Order[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase: La tabla "orders" no responde. Ejecuta el script SQL en tu panel de Supabase.', error);
      return null;
    }

    return (data || []).map(mapDbOrderToApp);
  } catch (err) {
    console.warn('Supabase: Error al obtener pedidos.', err);
    return null;
  }
}

/**
 * Guarda o actualiza un pedido en Supabase.
 */
export async function saveOrderDb(order: Order): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbPayload = mapAppOrderToDb(order);

    const { error } = await supabase
      .from('orders')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase: No se pudo guardar el pedido. Verifica la tabla "orders".', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase: Error al guardar pedido.', err);
    return false;
  }
}

/**
 * Elimina un pedido de Supabase.
 */
export async function deleteOrderDb(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase: No se pudo eliminar el pedido.', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase: Error al eliminar pedido.', err);
    return false;
  }
}

/**
 * Sincroniza y obtiene la configuración desde Supabase.
 */
export async function getSettingsDb(): Promise<AdminSettings | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      // Si no existe, podemos crear el registro por defecto
      if (error.code === 'PGRST116') {
        return null;
      }
      console.warn('Supabase: La tabla "settings" no responde. Ejecuta el script SQL en tu panel de Supabase.', error);
      return null;
    }

    return mapDbSettingsToApp(data);
  } catch (err) {
    console.warn('Supabase: Error al obtener configuración.', err);
    return null;
  }
}

/**
 * Guarda o actualiza la configuración en Supabase.
 */
export async function saveSettingsDb(settings: AdminSettings): Promise<boolean> {
  if (!supabase) return false;
  try {
    const dbPayload = mapAppSettingsToDb(settings);

    const { error } = await supabase
      .from('settings')
      .upsert(dbPayload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase: No se pudo guardar la configuración. Verifica la tabla "settings".', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase: Error al guardar la configuración.', err);
    return false;
  }
}

/**
 * Sube una imagen a Supabase Storage (Bucket "productos") y devuelve la URL pública.
 * Soporta archivos directos de input (File / Blob).
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase no configurado para subidas.');
    return null;
  }

  try {
    // Nombre de archivo sanitizado
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${productId}_${Date.now()}.${fileExt}`;
    const filePath = `${productId}/${fileName}`;

    // Subir el archivo al bucket "productos"
    const { data, error } = await supabase.storage
      .from('productos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Supabase Storage: No se pudo subir el archivo. Revisa el bucket "productos".', error);
      throw error;
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('productos')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Supabase Storage: Excepción al subir imagen.', err);
    return null;
  }
}
