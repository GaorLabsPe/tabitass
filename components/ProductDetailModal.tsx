import React, { useState } from 'react';
import { Product, AdminSettings } from '../types';
import { calculateFinalPrice, calculateAdvance, formatCurrency, getWhatsAppUrl } from '../utils';
import { X, Calendar, ShoppingBag, MessageSquare, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: Product;
  settings: AdminSettings;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, settings, onClose, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [sizeError, setSizeError] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);

  const finalPrice = calculateFinalPrice(product);
  const advanceRequired = calculateAdvance(product, finalPrice, settings);
  const balanceDue = finalPrice - advanceRequired;

  const handleAddToCart = () => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    onAddToCart(product, selectedSize, quantity);
    onClose();
  };

  const imagesList = product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl relative z-10 grid grid-cols-1 md:grid-cols-2 max-h-[90vh] md:max-h-[85vh]"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-full p-2 z-20 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Image Gallery */}
        <div className="relative bg-slate-100 flex flex-col justify-between h-[300px] md:h-full overflow-hidden">
          <div className="relative flex-grow flex items-center justify-center overflow-hidden">
            <img
              src={imagesList[activeImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Slider arrows */}
            {imagesList.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1))}
                  className="absolute left-2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-1.5 shadow-xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-1.5 shadow-xs transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {imagesList.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-900/30 backdrop-blur-xs px-2.5 py-1.5 rounded-full">
              {imagesList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeImageIndex ? 'bg-orange-500 w-3.5' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Details & Ordering */}
        <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto h-[450px] md:h-full">
          <div>
            {/* Category / Brand */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                {product.brand}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500 font-medium">{product.category}</span>
            </div>

            {/* Title */}
            <h2 className="text-slate-900 text-xl font-bold font-display leading-snug mb-3">
              {product.name}
            </h2>

            {/* Badge */}
            <div className="mb-4">
              {product.modality === 'stock' ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Disponible para entrega inmediata
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 text-xs font-medium px-2.5 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Pedido por encargo (Llega en {product.leadTimeDays} días)
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {product.description}
            </p>

            {/* Sizes selector */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selecciona Talla / Medida:
                </span>
                {sizeError && (
                  <span className="text-[11px] text-red-500 font-medium animate-pulse">
                    ⚠️ Selecciona una talla antes de pedir
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`min-w-[40px] px-3 py-2 text-xs font-mono font-semibold rounded-lg border transition-all flex items-center justify-center ${
                      selectedSize === size
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Cantidad:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
              <div className="flex justify-between items-end mb-3 pb-3 border-b border-slate-200/60">
                <span className="text-xs font-medium text-slate-500">Monto Subtotal</span>
                <span className="text-2xl font-extrabold text-slate-900 font-display">
                  {formatCurrency(finalPrice * quantity)}
                </span>
              </div>

              {/* Advanced info - calculated automatically */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Adelanto para reservar:</span>
                  <span className="text-slate-900 font-bold text-xs">{formatCurrency(advanceRequired * quantity)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Saldo a pagar al recibir:</span>
                  <span className="text-slate-900 font-bold text-xs">{formatCurrency(balanceDue * quantity)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout & Add to Cart button */}
          <div className="space-y-2.5">
            <button
              onClick={handleAddToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md shadow-orange-500/10 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
              Agregar al Carrito
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Agrégalo y sigue explorando el catálogo.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
