import React, { useState } from 'react';
import { Product } from '../types';
import { calculateFinalPrice, calculateAdvance, formatCurrency } from '../utils';
import { Plus, Edit2, Trash2, Save, X, Eye, Image, Info } from 'lucide-react';

interface AdminProductsProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const POPULAR_SIZES_SNEAKERS = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
const POPULAR_SIZES_APPAREL = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Default values for new products
  const createEmptyProduct = (): Partial<Product> => ({
    id: 'prod_' + Date.now(),
    name: '',
    category: 'Zapatillas',
    brand: '',
    sizes: [],
    images: [''],
    cost: 0,
    marginType: 'percentage',
    margin: 40,
    modality: 'stock',
    leadTimeDays: 0,
    advanceType: 'percentage',
    advanceValue: 50,
    description: ''
  });

  const handleStartAdd = () => {
    setEditingProduct(createEmptyProduct());
    setIsEditing(true);
  };

  const handleStartEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingProduct) return;

    const { name, brand, sizes, images } = editingProduct;
    if (!name || !brand || !sizes || sizes.length === 0) {
      alert('Por favor, completa al menos: Nombre, Marca y Tallas.');
      return;
    }

    // Clean up empty image URLs
    const cleanedImages = (images || []).filter((url) => url.trim() !== '');
    if (cleanedImages.length === 0) {
      cleanedImages.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600');
    }

    const fullProduct = {
      ...editingProduct,
      images: cleanedImages,
    } as Product;

    if (products.some((p) => p.id === fullProduct.id)) {
      onUpdateProduct(fullProduct);
    } else {
      onAddProduct(fullProduct);
    }

    setIsEditing(false);
    setEditingProduct(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingProduct(null);
  };

  const handleFieldChange = (key: keyof Product, value: any) => {
    if (!editingProduct) return;
    setEditingProduct((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleSize = (size: string) => {
    if (!editingProduct) return;
    const currentSizes = editingProduct.sizes || [];
    const updatedSizes = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size];
    handleFieldChange('sizes', updatedSizes);
  };

  // Helper calculation values for form preview
  const previewPrice = editingProduct ? calculateFinalPrice(editingProduct as Product) : 0;
  const previewAdvance = editingProduct ? calculateAdvance(editingProduct as Product, previewPrice) : 0;
  const previewBalance = previewPrice - previewAdvance;

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">Gestión de Inventario</h2>
          <p className="text-xs text-slate-500">Agrega, edita y gestiona el catálogo de productos de Tabitas</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartAdd}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Editor Panel */}
      {isEditing && editingProduct && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 animate-fadeIn">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
            <h3 className="font-bold text-slate-900 font-display">
              {products.some((p) => p.id === editingProduct.id) ? '📝 Editar Producto' : '🚀 Nuevo Producto'}
            </h3>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Info General */}
            <div className="space-y-4 lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre del Producto *</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    placeholder="Ej. Nike Air Max 90 Classic"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Marca *</label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    placeholder="Ej. Nike, Adidas, Puma"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Categoría</label>
                  <select
                    value={editingProduct.category || 'Zapatillas'}
                    onChange={(e) => {
                      const cat = e.target.value as 'Zapatillas' | 'Buzos deportivos';
                      handleFieldChange('category', cat);
                      // Clear sizes since categories change types
                      handleFieldChange('sizes', []);
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  >
                    <option value="Zapatillas">Zapatillas (Calzado)</option>
                    <option value="Buzos deportivos">Buzos Deportivos (Ropa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Modalidad de Entrega</label>
                  <select
                    value={editingProduct.modality || 'stock'}
                    onChange={(e) => {
                      const mod = e.target.value as 'stock' | 'encargo';
                      handleFieldChange('modality', mod);
                      if (mod === 'stock') {
                        handleFieldChange('leadTimeDays', 0);
                      } else {
                        handleFieldChange('leadTimeDays', 15);
                      }
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  >
                    <option value="stock">Stock Disponible (Entrega Inmediata)</option>
                    <option value="encargo">Por Encargo (Pedido al extranjero)</option>
                  </select>
                </div>
              </div>

              {editingProduct.modality === 'encargo' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tiempo de Entrega Estimado (días)</label>
                  <input
                    type="number"
                    value={editingProduct.leadTimeDays || 0}
                    onChange={(e) => handleFieldChange('leadTimeDays', parseInt(e.target.value) || 0)}
                    placeholder="Ej. 15"
                    className="w-32 text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                    min="1"
                  />
                </div>
              )}

              {/* Sizes Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tallas Disponibles * (Selecciona las tallas activas)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  {(editingProduct.category === 'Zapatillas' ? POPULAR_SIZES_SNEAKERS : POPULAR_SIZES_APPAREL).map((size) => {
                    const isSelected = (editingProduct.sizes || []).includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photos URL Inputs */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">URLs de Fotos (Máx. 3)</label>
                <div className="space-y-2">
                  {(editingProduct.images || []).map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => {
                            const newImages = [...(editingProduct.images || [])];
                            newImages[index] = e.target.value;
                            handleFieldChange('images', newImages);
                          }}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full text-xs px-3 py-2 pl-8 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                        />
                        <Image className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = (editingProduct.images || []).filter((_, idx) => idx !== index);
                          handleFieldChange('images', newImages);
                        }}
                        className="text-red-500 hover:text-red-600 p-2 border border-red-100 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(editingProduct.images || []).length < 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = [...(editingProduct.images || []), ''];
                        handleFieldChange('images', newImages);
                      }}
                      className="text-xs text-orange-500 font-bold hover:text-orange-600 flex items-center gap-1 mt-1"
                    >
                      + Añadir URL de imagen
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Descripción pública del producto</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Detalles sobre materiales, comodidad, estilo, etc."
                  rows={3}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Column 2: Financial Calculator (ADMIN eyes only!) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2.5 mb-2">
                  <Info className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Calculadora de Precios
                  </span>
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Costo de Compra (S/ ) *</label>
                  <input
                    type="number"
                    value={editingProduct.cost || ''}
                    onChange={(e) => handleFieldChange('cost', parseFloat(e.target.value) || 0)}
                    placeholder="S/ 150"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    min="0"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Lo que le pagas al proveedor.</span>
                </div>

                {/* Profit Margin */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Margen</label>
                    <select
                      value={editingProduct.marginType || 'percentage'}
                      onChange={(e) => handleFieldChange('marginType', e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto Fijo (S/)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Margen</label>
                    <input
                      type="number"
                      value={editingProduct.margin || ''}
                      onChange={(e) => handleFieldChange('margin', parseFloat(e.target.value) || 0)}
                      placeholder={editingProduct.marginType === 'percentage' ? '40%' : 'S/ 50'}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      min="0"
                    />
                  </div>
                </div>

                {/* Advance Configuration */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Adelanto</label>
                    <select
                      value={editingProduct.advanceType || 'percentage'}
                      onChange={(e) => handleFieldChange('advanceType', e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="percentage">Porcentaje (%)</option>
                      <option value="fixed">Monto Fijo (S/)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Adelanto</label>
                    <input
                      type="number"
                      value={editingProduct.advanceValue || ''}
                      onChange={(e) => handleFieldChange('advanceValue', parseFloat(e.target.value) || 0)}
                      placeholder="50"
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                      min="0"
                    />
                  </div>
                </div>

                {/* Calculation Outputs (Resulting Preview) */}
                <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Precio Venta (Público):</span>
                    <span className="text-slate-900 font-extrabold">{formatCurrency(previewPrice)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Adelanto de Reserva:</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(previewAdvance)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Saldo al Recibir:</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(previewBalance)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-emerald-600 border-t border-dashed border-slate-200 pt-2 text-sm">
                    <span>Utilidad Estimada:</span>
                    <span className="font-extrabold">{formatCurrency(previewPrice - (editingProduct.cost || 0))}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-grow bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  Guardar Producto
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Productos Registrados ({products.length})</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-center">Modalidad</th>
                <th className="p-4 text-right">Costo Compra</th>
                <th className="p-4 text-right">Margen</th>
                <th className="p-4 text-right bg-orange-50/30 text-orange-600">Precio Final</th>
                <th className="p-4 text-right text-emerald-600">Ganancia</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No hay productos registrados. Haz clic en "Nuevo Producto" para empezar.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const finalPrice = calculateFinalPrice(prod);
                  const marginLabel = prod.marginType === 'percentage' ? `${prod.margin}%` : `S/ ${prod.margin}`;
                  const profit = finalPrice - prod.cost;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* Name / Brand / Image */}
                      <td className="p-4 flex items-center gap-3">
                        <img
                          src={prod.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'}
                          alt={prod.name}
                          className="w-10 h-10 object-cover rounded-lg bg-slate-100 border border-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900 leading-tight">{prod.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{prod.brand}</div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="inline-flex bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {prod.category}
                        </span>
                      </td>

                      {/* Modality */}
                      <td className="p-4 text-center">
                        {prod.modality === 'stock' ? (
                          <span className="inline-flex bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Stock
                          </span>
                        ) : (
                          <span className="inline-flex bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            Encargo ({prod.leadTimeDays}d)
                          </span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="p-4 text-right font-medium text-slate-500">
                        {formatCurrency(prod.cost)}
                      </td>

                      {/* Margin */}
                      <td className="p-4 text-right font-medium text-slate-600">
                        {marginLabel}
                      </td>

                      {/* Final Selling Price */}
                      <td className="p-4 text-right font-extrabold text-slate-900 font-display bg-orange-50/30">
                        {formatCurrency(finalPrice)}
                      </td>

                      {/* Profit */}
                      <td className="p-4 text-right font-bold text-emerald-600">
                        {formatCurrency(profit)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de que deseas eliminar ${prod.name}?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
