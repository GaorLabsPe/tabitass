import React from 'react';
import { Product } from '../types';
import { calculateFinalPrice, formatCurrency } from '../utils';
import { Tag, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const finalPrice = calculateFinalPrice(product);

  return (
    <motion.div
      id={`prod-card-${product.id}`}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer flex flex-col h-full"
      onClick={() => onSelect(product)}
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden group">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {/* Availability Badge */}
        <div className="absolute top-3 left-3 z-10">
          {product.modality === 'stock' ? (
            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Disponible Ya
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
              <Sparkles className="w-3 h-3" />
              Por Encargo
            </span>
          )}
        </div>

        {/* Category Tag */}
        <div className="absolute bottom-3 right-3 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md">
          {product.category}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">
          {product.brand}
        </div>
        <h3 className="text-slate-800 font-semibold text-sm line-clamp-2 min-h-[40px] leading-tight mb-2">
          {product.name}
        </h3>

        {/* Sizes Preview */}
        <div className="mb-4">
          <div className="text-[10px] text-slate-400 font-medium mb-1">Tallas disponibles:</div>
          <div className="flex flex-wrap gap-1">
            {product.sizes.slice(0, 4).map((size) => (
              <span key={size} className="text-[10px] font-mono font-medium text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-sm">
                {size}
              </span>
            ))}
            {product.sizes.length > 4 && (
              <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-sm">
                +{product.sizes.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Price Tag (Final selling price) */}
        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block leading-none">Precio</span>
            <span className="text-lg font-extrabold font-display text-slate-900 leading-none">
              {formatCurrency(finalPrice)}
            </span>
          </div>
          <button 
            className="bg-slate-900 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
          >
            Ver más
          </button>
        </div>
      </div>
    </motion.div>
  );
};
