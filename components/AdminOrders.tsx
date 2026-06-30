import React, { useState } from 'react';
import { Order, Product, AdminSettings } from '../types';
import { calculateFinalPrice, calculateAdvance, formatCurrency } from '../utils';
import { MessageSquare, Calendar, CreditCard, Truck, Plus, X, Trash2, CheckCircle2 } from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  products: Product[];
  settings: AdminSettings;
  onAddOrder: (order: Order) => void;
  onUpdateOrderStatus: (
    id: string,
    field: 'paymentStatus' | 'deliveryStatus',
    value: any
  ) => void;
  onDeleteOrder: (id: string) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  products,
  settings,
  onAddOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
}) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  
  // States for adding products to a temp manual list
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [manualItems, setManualItems] = useState<Order['items']>([]);

  // Client Details
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [shippingType, setShippingType] = useState<'huancayo' | 'provincia'>('huancayo');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<Order['paymentStatus']>('adelanto_pagado');
  const [deliveryStatus, setDeliveryStatus] = useState<Order['deliveryStatus']>('pendiente');
  const [notes, setNotes] = useState<string>('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddProductToManualList = () => {
    if (!selectedProductId || !selectedSize) {
      alert('Por favor selecciona un producto y su talla.');
      return;
    }
    const prod = products.find((p) => p.id === selectedProductId)!;
    const finalPrice = calculateFinalPrice(prod);
    const advanceRequired = calculateAdvance(prod, finalPrice, settings);

    // Check if product with same size is already in manualItems, if so increase quantity
    const existingIndex = manualItems.findIndex(
      (item) => item.productId === prod.id && item.sizeSelected === selectedSize
    );

    if (existingIndex > -1) {
      const updated = [...manualItems];
      updated[existingIndex].quantity += selectedQuantity;
      setManualItems(updated);
    } else {
      setManualItems((prev) => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          productBrand: prod.brand,
          productImage: prod.images[0] || '',
          sizeSelected: selectedSize,
          quantity: selectedQuantity,
          pricePerUnit: finalPrice,
          advancePerUnit: advanceRequired,
        },
      ]);
    }

    // Reset selection inputs
    setSelectedProductId('');
    setSelectedSize('');
    setSelectedQuantity(1);
  };

  const handleRemoveProductFromManualList = (idx: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculate totals of manual list
  const manualTotal = manualItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
  const manualAdvance = Math.min(35, manualTotal);
  const manualBalance = manualTotal - manualAdvance;

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualItems.length === 0) {
      alert('Por favor agrega al menos un producto al pedido.');
      return;
    }
    if (!clientName || !clientPhone) {
      alert('Por favor, completa los datos del cliente (Nombre y Celular).');
      return;
    }

    const defaultShippingLabel = shippingType === 'huancayo' ? 'Huancayo (Preferencia)' : 'Otras Provincias';
    const finalShippingAddress = shippingType === 'huancayo' ? 'Coordinación interna' : shippingAddress;

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      date: new Date().toISOString(),
      clientName,
      clientPhone,
      clientType: 'general',
      shippingType,
      shippingAddress: finalShippingAddress || defaultShippingLabel,
      items: manualItems,
      totalPrice: manualTotal,
      advanceRequired: manualAdvance,
      balanceDue: manualBalance,
      paymentStatus,
      deliveryStatus,
      notes: notes || `Orden manual con ${manualItems.length} producto(s).`
    };

    onAddOrder(newOrder);

    // Reset Form
    setManualItems([]);
    setClientName('');
    setClientPhone('');
    setShippingType('huancayo');
    setShippingAddress('');
    setPaymentStatus('adelanto_pagado');
    setDeliveryStatus('pendiente');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">Estado de Pedidos</h2>
          <p className="text-xs text-slate-500">Registra y controla los pagos de Yape/Plin y el envío de productos</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Registrar Venta Manual
          </button>
        )}
      </div>

      {/* Add Order Modal/Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateOrder}
          className="bg-white rounded-3xl border border-slate-100 shadow-md p-6 space-y-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-950 font-display">📝 Registrar Nuevo Pedido Manual</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            {/* Product selection */}
            <div className="md:col-span-5">
              <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar Producto</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedSize('');
                }}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="">-- Elige un producto --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.brand} - {p.name} ({formatCurrency(calculateFinalPrice(p))})
                  </option>
                ))}
              </select>
            </div>

            {/* Size selection */}
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Talla / Medida</label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                disabled={!selectedProductId}
              >
                <option value="">-- Elige talla --</option>
                {selectedProduct?.sizes.map((s) => (
                  <option key={s} value={s}>
                    Talla {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={selectedQuantity}
                onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
              />
            </div>

            {/* Add Button */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddProductToManualList}
                className="w-full bg-slate-900 hover:bg-orange-500 text-white font-bold text-xs py-2 rounded-xl transition-colors shadow-xs"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* List of current manualItems */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Productos en este pedido manual:</span>
            {manualItems.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-xs text-slate-400 font-medium">
                No hay productos agregados todavía. Elige producto y talla de arriba y haz clic en Agregar.
              </div>
            ) : (
              <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100">
                {manualItems.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'}
                        alt={item.productName}
                        className="w-8 h-8 object-cover rounded border border-slate-100 bg-slate-50"
                      />
                      <div>
                        <span className="font-bold text-slate-900">{item.productName}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Talla: <span className="font-mono font-bold text-slate-600">{item.sizeSelected}</span>
                          <span className="mx-1.5">•</span>
                          Cant: <span className="font-bold text-slate-600">{item.quantity}</span>
                          <span className="mx-1.5">•</span>
                          Unitario: <span className="font-bold text-slate-600">{formatCurrency(item.pricePerUnit)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 font-display">
                        {formatCurrency(item.pricePerUnit * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProductFromManualList(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Client Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Cliente *</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Alejandra Gómez"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>

            {/* Client Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Celular *</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Ej. 987654321"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                required
              />
            </div>

            {/* Shipping Type */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Destino de Envío</label>
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100/50">
                  Por Shalom 📦
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 h-[38px]">
                <button
                  type="button"
                  onClick={() => setShippingType('huancayo')}
                  className={`text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all duration-200 ${
                    shippingType === 'huancayo'
                      ? 'border-orange-500 bg-orange-50/40 text-orange-800 font-extrabold ring-1 ring-orange-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Huancayo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShippingType('provincia')}
                  className={`text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all duration-200 ${
                    shippingType === 'provincia'
                      ? 'border-orange-500 bg-orange-50/40 text-orange-800 font-extrabold ring-1 ring-orange-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  <span>Provincias</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Shipping Address */}
            <div className="flex flex-col justify-between">
              {shippingType === 'provincia' ? (
                <>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Escribe la Provincia y Datos *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Ej. Arequipa - Agencia Shalom"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    💡 Los envíos son por <strong>Shalom</strong> a nivel nacional.
                  </p>
                </>
              ) : (
                <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100/30 text-[10px] text-orange-700 leading-normal mt-5">
                  <strong>📍 Huancayo:</strong> No se requiere ingresar dirección. La entrega/punto de retiro se coordinará directamente por WhatsApp. 🏡
                </div>
              )}
            </div>

            {/* Payment state */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Pago Inicial</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as Order['paymentStatus'])}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="adelanto_pagado">Adelanto Pagado (Reserva hecha)</option>
                <option value="saldo_pendiente">Saldo Pendiente (Listo para entrega)</option>
                <option value="completado">Completado (100% Pagado)</option>
              </select>
            </div>

            {/* Delivery State */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Entrega Inicial</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value as Order['deliveryStatus'])}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
              >
                <option value="pendiente">Pendiente (No enviado)</option>
                <option value="en_camino">En Camino / En Aduana</option>
                <option value="entregado">Entregado al Cliente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas del Pedido</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Pagó adelanto de S/150 por Yape. Recoge en oficina de San Borja."
              rows={2}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 resize-none"
            />
          </div>

          {manualItems.length > 0 && (
            <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100/80 flex flex-wrap justify-between items-center text-xs gap-4 shadow-3xs">
              <div>
                <span className="text-slate-500 font-medium">Monto Total de Pedido:</span>{' '}
                <span className="font-black text-slate-900 text-sm font-display">{formatCurrency(manualTotal)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Adelanto Mínimo Total:</span>{' '}
                <span className="font-black text-slate-900 text-sm font-display">{formatCurrency(manualAdvance)}</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Saldo Pendiente al Recibir:</span>{' '}
                <span className="font-black text-orange-600 text-sm font-display">{formatCurrency(manualBalance)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              Registrar Pedido
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div>
          {/* Desktop View: Hidden on mobile/tablet, shown on lg screens up */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="p-4">Pedido / Fecha</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Producto & Talla</th>
                  <th className="p-4 text-right">Precio Total</th>
                  <th className="p-4 text-right">Adelanto</th>
                  <th className="p-4 text-right">Saldo Restante</th>
                  <th className="p-4 text-center">Estado Pago</th>
                  <th className="p-4 text-center">Estado Entrega</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No hay pedidos registrados aún. ¡Registra tu primera venta manual o espera mensajes de clientes!
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/30 transition-colors">
                      {/* ID / Date */}
                      <td className="p-4">
                        <div className="font-mono text-[10px] font-bold text-slate-400">#{ord.id}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {new Date(ord.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Client Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{ord.clientName}</span>
                          {ord.clientType === 'trusted' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-md">
                              Confianza
                            </span>
                          )}
                          {ord.shippingType && (
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                              ord.shippingType === 'provincia' 
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                : 'bg-orange-50 text-orange-700 border border-orange-100'
                            }`}>
                              {ord.shippingType === 'provincia' ? 'Otras Provincias' : 'Huancayo'}
                            </span>
                          )}
                        </div>
                        <a
                          href={`https://wa.me/51${ord.clientPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold mt-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-emerald-100" />
                          {ord.clientPhone}
                        </a>
                        {ord.shippingAddress && (
                          <div className="text-[10px] text-slate-400 mt-1 max-w-[180px] bg-slate-50/50 px-1.5 py-1 rounded border border-slate-100 italic leading-normal">
                            📍 {ord.shippingAddress}
                          </div>
                        )}
                      </td>

                      {/* Product & Size */}
                      <td className="p-4">
                        <div className="space-y-1.5 max-w-xs">
                          {ord.items && ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <img
                                src={item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'}
                                alt={item.productName}
                                className="w-8 h-8 object-cover rounded border border-slate-100 bg-slate-50 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 leading-tight truncate text-[11px]" title={item.productName}>
                                  {item.productName}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Talla: <span className="font-mono font-bold text-slate-600">{item.sizeSelected}</span>
                                  {item.quantity > 1 && (
                                    <span className="ml-1 text-orange-600 font-bold">x{item.quantity}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Financial Numbers */}
                      <td className="p-4 text-right font-bold text-slate-900 font-display">
                        {formatCurrency(ord.totalPrice)}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-600">
                        {formatCurrency(ord.advanceRequired)}
                      </td>
                      <td className="p-4 text-right font-medium text-orange-600">
                        {formatCurrency(ord.balanceDue)}
                      </td>

                      {/* Payment Status Dropdown selector */}
                      <td className="p-4 text-center">
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) =>
                            onUpdateOrderStatus(ord.id, 'paymentStatus', e.target.value)
                          }
                          className={`text-[10px] font-bold py-1 px-2.5 rounded-full border border-transparent focus:ring-1 focus:ring-slate-300 ${
                            ord.paymentStatus === 'completado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.paymentStatus === 'saldo_pendiente'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="adelanto_pagado">Adelanto Pagado</option>
                          <option value="saldo_pendiente">Saldo Pendiente</option>
                          <option value="completado">Completado</option>
                        </select>
                      </td>

                      {/* Delivery Status Dropdown selector */}
                      <td className="p-4 text-center">
                        <select
                          value={ord.deliveryStatus}
                          onChange={(e) =>
                            onUpdateOrderStatus(ord.id, 'deliveryStatus', e.target.value)
                          }
                          className={`text-[10px] font-bold py-1 px-2.5 rounded-full border border-transparent focus:ring-1 focus:ring-slate-300 ${
                            ord.deliveryStatus === 'entregado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.deliveryStatus === 'en_camino'
                              ? 'bg-purple-100 text-purple-800'
                              : ord.deliveryStatus === 'cancelado'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_camino">En Camino</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>

                      {/* Quick actions */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar registro de pedido de ${ord.clientName}?`)) {
                                onDeleteOrder(ord.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile View: Hidden on desktop, shown on small/medium screens */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No hay pedidos registrados aún. ¡Registra tu primera venta manual o espera mensajes de clientes!
              </div>
            ) : (
              orders.map((ord) => (
                <div key={ord.id} className="p-4 space-y-3 hover:bg-slate-50/25 transition-colors">
                  {/* Header: ID and Date */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-black text-slate-400">ID: #{ord.id}</span>
                    <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
                      {new Date(ord.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Client name, Phone & badgess */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm leading-tight">{ord.clientName}</span>
                      {ord.clientType === 'trusted' && (
                        <span className="text-[9px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.5 rounded">
                          Confianza
                        </span>
                      )}
                      {ord.shippingType && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          ord.shippingType === 'provincia' 
                            ? 'bg-indigo-100 text-indigo-900' 
                            : 'bg-orange-100 text-orange-900'
                        }`}>
                          {ord.shippingType === 'provincia' ? 'Provincia' : 'Huancayo'}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`https://wa.me/51${ord.clientPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 border border-emerald-100/50 px-2.5 py-1.5 rounded-xl min-h-[38px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-emerald-100" />
                        {ord.clientPhone} (WhatsApp)
                      </a>
                    </div>

                    {ord.shippingAddress && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        📍 {ord.shippingAddress}
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="border-t border-b border-dashed border-slate-200 py-2.5 space-y-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Productos</span>
                    {ord.items && ord.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <img
                          src={item.productImage || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'}
                          alt={item.productName}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                        />
                        <div className="min-w-0 flex-grow">
                          <div className="font-semibold text-slate-800 text-xs leading-snug truncate">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Talla: <span className="font-mono font-bold text-slate-600">{item.sizeSelected}</span>
                            {item.quantity > 1 && (
                              <span className="ml-1.5 text-orange-600 font-bold">x{item.quantity}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/60">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Total</span>
                      <span className="text-xs font-black text-slate-800 font-display">{formatCurrency(ord.totalPrice)}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100/60">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Adelanto</span>
                      <span className="text-xs font-bold text-slate-700 font-display">{formatCurrency(ord.advanceRequired)}</span>
                    </div>
                    <div className="bg-orange-50/50 p-2 rounded-xl border border-orange-100/30">
                      <span className="text-[9px] text-orange-500 uppercase font-bold block font-sans">Saldo</span>
                      <span className="text-xs font-black text-orange-600 font-display">{formatCurrency(ord.balanceDue)}</span>
                    </div>
                  </div>

                  {/* Selectors */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block">Estado Pago</label>
                      <select
                        value={ord.paymentStatus}
                        onChange={(e) =>
                          onUpdateOrderStatus(ord.id, 'paymentStatus', e.target.value)
                        }
                        className={`w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-slate-300 ${
                          ord.paymentStatus === 'completado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : ord.paymentStatus === 'saldo_pendiente'
                            ? 'bg-blue-50 text-blue-800 border-blue-100'
                            : 'bg-amber-50 text-amber-800 border-amber-100'
                        }`}
                      >
                        <option value="adelanto_pagado">Adelanto Pagado</option>
                        <option value="saldo_pendiente">Saldo Pendiente</option>
                        <option value="completado">Completado</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block">Entrega</label>
                      <select
                        value={ord.deliveryStatus}
                        onChange={(e) =>
                          onUpdateOrderStatus(ord.id, 'deliveryStatus', e.target.value)
                        }
                        className={`w-full text-xs font-bold py-2 px-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-slate-300 ${
                          ord.deliveryStatus === 'entregado'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : ord.deliveryStatus === 'en_camino'
                            ? 'bg-purple-50 text-purple-800 border-purple-100'
                            : ord.deliveryStatus === 'cancelado'
                            ? 'bg-rose-50 text-rose-800 border-rose-100'
                            : 'bg-slate-50 text-slate-800 border-slate-100'
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_camino">En Camino</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar registro de pedido de ${ord.clientName}?`)) {
                          onDeleteOrder(ord.id);
                        }
                      }}
                      className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold px-3 py-2 rounded-xl transition-all min-h-[38px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar Registro
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
