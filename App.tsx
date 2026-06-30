import React, { useState, useEffect } from 'react';
import { Product, Order, AdminSettings, CartItem } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, DEFAULT_SETTINGS } from './data';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AdminProducts } from './components/AdminProducts';
import { AdminOrders } from './components/AdminOrders';
import { AdminSettingsPanel } from './components/AdminSettings';
import { calculateFinalPrice, calculateAdvance, formatCurrency, getCartWhatsAppUrl } from './utils';
import {
  isSupabaseConfigured,
  getProductsDb,
  saveProductDb,
  deleteProductDb,
  getOrdersDb,
  saveOrderDb,
  deleteOrderDb,
  getSettingsDb,
  saveSettingsDb
} from './supabaseClient';
import {
  Search,
  Filter,
  Lock,
  Settings,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Sparkles,
  Info,
  Calendar,
  HelpCircle,
  TrendingUp,
  Clock,
  X,
  Trash2,
  Plus,
  Minus,
  Truck,
  MapPin,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SUPABASE_SQL_SETUP = `CREATE SCHEMA IF NOT EXISTS tabitass;

-- 1. Crear tabla de productos
CREATE TABLE IF NOT EXISTS tabitass.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  brand TEXT NOT NULL,
  sizes JSONB NOT NULL DEFAULT '[]',
  images JSONB NOT NULL DEFAULT '[]',
  cost NUMERIC NOT NULL DEFAULT 0,
  margin_type TEXT NOT NULL DEFAULT 'percentage',
  margin NUMERIC NOT NULL DEFAULT 0,
  modality TEXT NOT NULL DEFAULT 'stock',
  lead_time_days INTEGER NOT NULL DEFAULT 0,
  advance_type TEXT NOT NULL DEFAULT 'percentage',
  advance_value NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de pedidos (orders)
CREATE TABLE IF NOT EXISTS tabitass.orders (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_type TEXT NOT NULL DEFAULT 'general',
  shipping_type TEXT NOT NULL DEFAULT 'huancayo',
  shipping_address TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]',
  total_price NUMERIC NOT NULL DEFAULT 0,
  advance_required NUMERIC NOT NULL DEFAULT 0,
  balance_due NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pendiente',
  delivery_status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de configuración (settings)
CREATE TABLE IF NOT EXISTS tabitass.settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  whatsapp_number TEXT,
  company_name TEXT DEFAULT 'Tabitas Store',
  yape_number TEXT,
  yape_name TEXT,
  plin_number TEXT,
  plin_name TEXT,
  advance_type_rule TEXT DEFAULT 'percentage',
  flat_advance_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar configuración inicial por defecto
INSERT INTO tabitass.settings (id, whatsapp_number, company_name, yape_number, yape_name, plin_number, plin_name, advance_type_rule, flat_advance_amount)
VALUES ('default', '51900000000', 'Tabitas Store', '900000000', 'Administrador', '900000000', 'Administrador', 'percentage', 50)
ON CONFLICT (id) DO NOTHING;

-- Desactivar RLS para acceso público simplificado
ALTER TABLE tabitass.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE tabitass.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE tabitass.settings DISABLE ROW LEVEL SECURITY;`;

export default function App() {
  // Global Persisted States
  const [products, setProducts] = useState<Product[]>(() => {
    const local = localStorage.getItem('tabitas_products');
    return local ? JSON.parse(local) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const local = localStorage.getItem('tabitas_orders');
    return local ? JSON.parse(local) : INITIAL_ORDERS;
  });

  const [settings, setSettings] = useState<AdminSettings>(() => {
    const local = localStorage.getItem('tabitas_settings');
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const local = localStorage.getItem('tabitas_admin_password');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed === 'admin123' || parsed === '_princesa') {
          return 'princesa';
        }
        return parsed;
      } catch (e) {
        return 'princesa';
      }
    }
    return 'princesa';
  });

  // Shopping Cart States
  const [cart, setCart] = useState<CartItem[]>(() => {
    const local = localStorage.getItem('tabitas_cart');
    return local ? JSON.parse(local) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [checkoutClientName, setCheckoutClientName] = useState<string>('');
  const [checkoutClientPhone, setCheckoutClientPhone] = useState<string>('');
  const [shippingType, setShippingType] = useState<'huancayo' | 'provincia'>('huancayo');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [checkoutAdvanceAmount, setCheckoutAdvanceAmount] = useState<number | ''>('');
  const [copied, setCopied] = useState<boolean>(false);

  // UI States
  const [currentView, setCurrentView] = useState<'catalog' | 'admin'>('catalog');
  const [adminSubTab, setAdminSubTab] = useState<'products' | 'orders' | 'settings'>('products');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('tabitas_is_logged_in') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Public Catalog Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'todos' | 'Zapatillas' | 'Buzos deportivos'>('todos');
  const [selectedBrand, setSelectedBrand] = useState<string>('todos');
  const [selectedSize, setSelectedSize] = useState<string>('todos');
  const [selectedModality, setSelectedModality] = useState<'todos' | 'stock' | 'encargo'>('todos');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);

  // Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'not_configured' | 'connecting' | 'connected' | 'error'>('not_configured');

  // Load from Supabase on mount
  useEffect(() => {
    async function loadData() {
      if (isSupabaseConfigured) {
        setSupabaseStatus('connecting');
        setIsLoadingSupabase(true);
        try {
          const dbProducts = await getProductsDb();
          if (dbProducts) {
            setProducts(dbProducts);
          } else {
            setSupabaseStatus('error');
            setIsLoadingSupabase(false);
            return;
          }

          const dbOrders = await getOrdersDb();
          if (dbOrders) {
            setOrders(dbOrders);
          }

          const dbSettings = await getSettingsDb();
          if (dbSettings) {
            setSettings(dbSettings);
          }

          setSupabaseStatus('connected');
        } catch (e) {
          console.error('Error cargando datos de Supabase:', e);
          setSupabaseStatus('error');
        } finally {
          setIsLoadingSupabase(false);
        }
      } else {
        setSupabaseStatus('not_configured');
      }
    }
    loadData();
  }, []);

  // Sync Data to LocalStorage
  useEffect(() => {
    localStorage.setItem('tabitas_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('tabitas_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('tabitas_settings', JSON.stringify(settings));
    if (isSupabaseConfigured && supabaseStatus === 'connected') {
      saveSettingsDb(settings);
    }
  }, [settings, supabaseStatus]);

  useEffect(() => {
    localStorage.setItem('tabitas_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('tabitas_admin_password', JSON.stringify(adminPassword));
  }, [adminPassword]);

  // URL Hash Listener for routing
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin') {
        setCurrentView('admin');
      } else {
        setCurrentView('catalog');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: 'catalog' | 'admin') => {
    if (view === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '';
    }
    setCurrentView(view);
  };

  // Login execution
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === adminPassword) {
      setIsLoggedIn(true);
      sessionStorage.setItem('tabitas_is_logged_in', 'true');
      setLoginError('');
      setPasswordInput('');
    } else {
      setLoginError('Contraseña incorrecta. Inténtalo de nuevo.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem('tabitas_is_logged_in');
    navigateTo('catalog');
  };

  // Product CRUD
  const handleAddProduct = async (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    if (isSupabaseConfigured && supabaseStatus === 'connected') {
      await saveProductDb(newProd);
    }
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
    if (isSupabaseConfigured && supabaseStatus === 'connected') {
      await saveProductDb(updatedProd);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (isSupabaseConfigured && supabaseStatus === 'connected') {
      await deleteProductDb(id);
    }
  };

  // Order CRUD
  const handleAddOrder = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    if (isSupabaseConfigured && supabaseStatus === 'connected') {
      await saveOrderDb(newOrder);
    }
  };

  const handleUpdateOrderStatus = async (
    id: string,
    field: 'paymentStatus' | 'deliveryStatus',
    value: any
  ) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, [field]: value } : o));
      const targetOrder = updated.find((o) => o.id === id);
      if (isSupabaseConfigured && supabaseStatus === 'connected' && targetOrder) {
        saveOrderDb(targetOrder);
      }
      return updated;
    });
  };

  const handleDeleteOrder = async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (isSupabaseConfigured && supabaseStatus === 'connected') {
      await deleteOrderDb(id);
    }
  };

  // Shopping Cart Actions
  const handleAddToCart = (product: Product, size: string, quantity: number) => {
    const compositeId = `${product.id}-${size}`;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === compositeId);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prevCart, { id: compositeId, product, sizeSelected: size, quantity }];
      }
    });
    setIsCartOpen(true); // Automatically open the cart drawer to show progress
  };

  const handleUpdateCartQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleCheckoutCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutClientName.trim() || !checkoutClientPhone.trim()) {
      alert('Por favor, ingresa tu nombre y celular para continuar.');
      return;
    }

    const orderItems = cart.map((item) => {
      const finalPrice = calculateFinalPrice(item.product);
      const advanceRequired = calculateAdvance(item.product, finalPrice, settings);
      return {
        productId: item.product.id,
        productName: item.product.name,
        productBrand: item.product.brand,
        productImage: item.product.images[0] || '',
        sizeSelected: item.sizeSelected,
        quantity: item.quantity,
        pricePerUnit: finalPrice,
        advancePerUnit: advanceRequired,
      };
    });

    const totalPrice = orderItems.reduce((sum, item) => sum + (item.pricePerUnit * item.quantity), 0);
    const baseMinAdvance = Math.min(35, totalPrice);
    
    // Custom advance payment editable by client, clamped to baseMinAdvance minimum
    const finalAdvance = Math.min(totalPrice, Math.max(baseMinAdvance, Number(checkoutAdvanceAmount) || baseMinAdvance));
    const balanceDue = totalPrice - finalAdvance;

    const shippingLabel = shippingType === 'huancayo' ? 'Huancayo (Preferencia)' : 'Otras Provincias';
    const finalShippingAddress = shippingType === 'huancayo' ? 'Coordinación interna' : shippingAddress;

    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      date: new Date().toISOString(),
      clientName: checkoutClientName,
      clientPhone: checkoutClientPhone,
      shippingType,
      shippingAddress: finalShippingAddress,
      items: orderItems,
      totalPrice,
      advanceRequired: finalAdvance,
      balanceDue,
      paymentStatus: 'adelanto_pagado',
      deliveryStatus: 'pendiente',
      notes: `Pedido de carrito web. Adelanto seleccionado: S/ ${finalAdvance}. Envío: ${shippingLabel} - Dirección: ${finalShippingAddress || 'Coordinación interna'}`
    };

    // Save order in state (persisted to LocalStorage automatically)
    handleAddOrder(newOrder);

    // Prepare WhatsApp URL data
    const urlItems = cart.map((item) => {
      const finalPrice = calculateFinalPrice(item.product);
      const advanceRequired = calculateAdvance(item.product, finalPrice, settings);
      return {
        productName: item.product.name,
        productBrand: item.product.brand,
        sizeSelected: item.sizeSelected,
        quantity: item.quantity,
        pricePerUnit: finalPrice,
        advancePerUnit: advanceRequired,
        modality: item.product.modality
      };
    });

    const url = getCartWhatsAppUrl(
      settings.whatsappNumber,
      urlItems,
      totalPrice,
      finalAdvance,
      balanceDue,
      checkoutClientName,
      checkoutClientPhone,
      shippingType,
      shippingType === 'huancayo' ? undefined : shippingAddress
    );

    // Redirect to WhatsApp
    window.open(url, '_blank');

    // Reset checkout states and clear cart
    setCart([]);
    setCheckoutClientName('');
    setCheckoutClientPhone('');
    setShippingType('huancayo');
    setShippingAddress('');
    setCheckoutAdvanceAmount('');
    setIsCartOpen(false);
  };

  // Dynamic filter lists compilation based on active inventory
  const availableBrands = ['todos', ...Array.from(new Set(products.map((p) => p.brand)))];
  const availableSizes = ['todos', ...Array.from(new Set(products.flatMap((p) => p.sizes))).sort()];

  // Catalog filtering calculation
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'todos' || prod.category === selectedCategory;

    const matchesBrand =
      selectedBrand === 'todos' || prod.brand === selectedBrand;

    const matchesSize =
      selectedSize === 'todos' || prod.sizes.includes(selectedSize);

    const matchesModality =
      selectedModality === 'todos' || prod.modality === selectedModality;

    return matchesSearch && matchesCategory && matchesBrand && matchesSize && matchesModality;
  });

  // Admin Metrics Calculation
  const totalSalesVolume = orders
    .filter((o) => o.paymentStatus === 'completado')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const totalAdvanceCollected = orders.reduce((sum, o) => sum + o.advanceRequired, 0);

  const totalOutstandingBalance = orders
    .filter((o) => o.paymentStatus !== 'completado')
    .reduce((sum, o) => sum + o.balanceDue, 0);

  const pendingDeliveriesCount = orders.filter((o) => o.deliveryStatus !== 'entregado' && o.deliveryStatus !== 'cancelado').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* ===================================================
          PUBLIC VIEW (CATALOG)
          =================================================== */}
      {currentView === 'catalog' && (
        <>
          {/* Top Info Ribbon */}
          <div className="bg-slate-900 text-white text-[11px] py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-4">
            <span>👟 ¡Zapatillas y Buzos Exclusivos ya disponibles!</span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-orange-500" />
            <span className="hidden sm:inline-block">📱 Haz tus pedidos directo a WhatsApp</span>
          </div>

          {/* Header */}
          <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
            <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              {/* Brand Logo */}
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => {
                setSearchQuery('');
                setSelectedCategory('todos');
                setSelectedBrand('todos');
                setSelectedSize('todos');
                setSelectedModality('todos');
              }}>
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-extrabold text-xl tracking-tighter shadow-md shadow-orange-500/20">
                  T
                </div>
                <div>
                  <h1 className="text-xl font-black font-display tracking-tight text-slate-950 flex items-center gap-1.5 leading-none">
                    {settings.companyName}
                    <span className="text-orange-500 text-xs bg-orange-50 px-1.5 py-0.5 rounded-md font-bold">SPORT</span>
                  </h1>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Catálogo de Ventas</p>
                </div>
              </div>

              {/* Main Category Tabs */}
              <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setSelectedCategory('todos')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategory === 'todos'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ver Todo
                </button>
                <button
                  onClick={() => setSelectedCategory('Zapatillas')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategory === 'Zapatillas'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Zapatillas
                </button>
                <button
                  onClick={() => setSelectedCategory('Buzos deportivos')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    selectedCategory === 'Buzos deportivos'
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Buzos deportivos
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                {/* Shopping Cart Button with Badge */}
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-slate-500 hover:text-orange-500 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5"
                  title="Ver Carrito de Compras"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5" />
                    {cart.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-700">Carrito</span>
                </button>

                {/* Go to admin link (discrete header icon) */}
                <button
                  onClick={() => navigateTo('admin')}
                  className="text-slate-400 hover:text-orange-500 p-2 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Administración Privada"
                >
                  <Lock className="w-4 h-4" />
                  <span className="hidden md:inline">Admin</span>
                </button>
              </div>
            </div>
          </header>

          {/* Hero Promo Section */}
          <section className="bg-slate-950 text-white relative overflow-hidden py-12 px-4">
            {/* Background effects */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 left-10 w-60 h-60 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-400 text-xs font-bold px-3.5 py-1 rounded-full border border-orange-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Temporada Invierno/Primavera 2026
              </span>
              <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white leading-none">
                VISTE CON ESTILO Y <span className="text-orange-500">MÁXIMO RENDIMIENTO</span>
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
                Adquiere zapatillas exclusivas y buzos de entrenamiento. Separa con un adelanto y paga el saldo al recibir tu pedido. Todo gestionado rápido por WhatsApp.
              </p>

              {/* Central Search bar */}
              <div className="max-w-md mx-auto pt-4 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Busca marcas, modelos o buzos..."
                    className="w-full text-xs text-slate-900 pl-10 pr-4 py-3 rounded-xl border-none bg-white focus:ring-2 focus:ring-orange-500 shadow-lg font-medium"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-3 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Filtering Tools and Catalog Grid */}
          <main className="max-w-6xl mx-auto px-4 py-8 flex-grow">
            {/* Filter Toggle Bar */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Filtros Avanzados</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Brand Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">Marca:</span>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700"
                  >
                    <option value="todos">Todas las marcas</option>
                    {availableBrands.filter(b => b !== 'todos').map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">Talla:</span>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700"
                  >
                    <option value="todos">Cualquiera</option>
                    {availableSizes.filter(s => s !== 'todos').map((size) => (
                      <option key={size} value={size}>Talla {size}</option>
                    ))}
                  </select>
                </div>

                {/* Modality Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500 font-bold">Disponibilidad:</span>
                  <select
                    value={selectedModality}
                    onChange={(e) => setSelectedModality(e.target.value as any)}
                    className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700"
                  >
                    <option value="todos">Todos</option>
                    <option value="stock">Entrega inmediata</option>
                    <option value="encargo">Por encargo</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                {(selectedBrand !== 'todos' || selectedSize !== 'todos' || selectedModality !== 'todos' || searchQuery !== '' || selectedCategory !== 'todos') && (
                  <button
                    onClick={() => {
                      setSelectedBrand('todos');
                      setSelectedSize('todos');
                      setSelectedModality('todos');
                      setSearchQuery('');
                      setSelectedCategory('todos');
                    }}
                    className="text-xs font-bold text-orange-500 hover:text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>

            {/* Catalog Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No encontramos resultados</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Prueba cambiando los filtros seleccionados o limpiando la barra de búsqueda.
                </p>
                <button
                  onClick={() => {
                    setSelectedBrand('todos');
                    setSelectedSize('todos');
                    setSelectedModality('todos');
                    setSearchQuery('');
                    setSelectedCategory('todos');
                  }}
                  className="bg-slate-900 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 mt-4 rounded-xl transition-colors"
                >
                  Mostrar todo el catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelect={(product) => setSelectedProduct(product)}
                  />
                ))}
              </div>
            )}
          </main>

          {/* Public Footer */}
          <footer className="bg-slate-950 text-white border-t border-slate-900 pt-10 pb-6 mt-16">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-900">
              {/* Box 1: Brand Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-extrabold text-base tracking-tighter">
                    T
                  </div>
                  <span className="font-bold text-base font-display">{settings.companyName}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Las zapatillas urbanas y deportivas más cotizadas y buzos importados de máxima calidad para todo el Perú.
                </p>
              </div>

              {/* Box 2: Payment options */}
              <div className="space-y-3 text-xs text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Medios de Pago</span>
                <p className="leading-relaxed">
                  Aceptamos depósitos y transferencias a nivel nacional. Priorizamos pagos rápidos sin comisiones vía <span className="text-white font-semibold">Yape o Plin</span>.
                </p>
                <div className="flex gap-2 pt-1">
                  <span className="bg-indigo-900/60 text-indigo-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-indigo-500/20">Yape</span>
                  <span className="bg-cyan-900/60 text-cyan-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-cyan-500/20">Plin</span>
                </div>
              </div>

              {/* Box 3: Security & Trust badge */}
              <div className="space-y-3 text-xs text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Proceso de Compra</span>
                <p className="leading-relaxed">
                  1. Elige el producto en el catálogo.<br />
                  2. Elige tu talla y haz clic en Pedir por WhatsApp.<br />
                  3. Te confirmamos stock y envías tu adelanto.<br />
                  4. ¡Recibes y pagas la diferencia!
                </p>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-[11px] text-slate-500 font-medium">
                © {new Date().getFullYear()} {settings.companyName}. Todos los derechos reservados.
              </p>
              <button
                onClick={() => navigateTo('admin')}
                className="text-[10px] uppercase tracking-wider font-semibold text-slate-600 hover:text-orange-500 transition-colors flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                Acceso Administrativo Privado
              </button>
            </div>
          </footer>

          {/* Product Detail Modal */}
          <AnimatePresence>
            {selectedProduct && (
              <ProductDetailModal
                product={selectedProduct}
                settings={settings}
                onClose={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
              />
            )}
          </AnimatePresence>

          {/* Floating Cart Button (bottom-right) */}
          <AnimatePresence>
            {cart.length > 0 && !isCartOpen && (
              <motion.button
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 50 }}
                onClick={() => setIsCartOpen(true)}
                className="fixed bottom-6 right-6 z-40 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white p-4 rounded-full shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 font-bold text-xs"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Ver Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Shopping Cart Drawer */}
          <AnimatePresence>
            {isCartOpen && (
              <div className="fixed inset-0 z-50 overflow-hidden">
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCartOpen(false)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
                />

                {/* Sliding panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col h-full z-10"
                >
                  {/* Drawer Header */}
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-orange-500" />
                      <h3 className="font-black text-slate-900 font-display">Tu Carrito de Compras</h3>
                    </div>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Body (Cart Items) */}
                  <div className="flex-grow p-5 overflow-y-auto space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center py-20 flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Tu carrito está vacío</h4>
                        <p className="text-xs text-slate-400 max-w-[200px] mx-auto">¡Agrega zapatillas o buzos deportivos desde el catálogo!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => {
                          const itemPrice = calculateFinalPrice(item.product);
                          return (
                            <div key={item.id} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 relative group">
                              <img
                                src={item.product.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600'}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-xl bg-white border border-slate-200/50 flex-shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-grow min-w-0 pr-6">
                                <span className="text-[10px] uppercase font-bold text-orange-500">{item.product.brand}</span>
                                <h5 className="font-semibold text-slate-900 text-xs truncate leading-tight">{item.product.name}</h5>
                                <p className="text-[10px] text-slate-400 mt-0.5">Talla: <span className="font-mono font-bold text-slate-600">{item.sizeSelected}</span></p>
                                
                                <div className="flex justify-between items-center mt-2">
                                  {/* Quantity selector */}
                                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCartQuantity(item.id, item.quantity - 1)}
                                      className="w-5 h-5 text-slate-500 hover:text-slate-800 rounded flex items-center justify-center hover:bg-slate-100 font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCartQuantity(item.id, item.quantity + 1)}
                                      className="w-5 h-5 text-slate-500 hover:text-slate-800 rounded flex items-center justify-center hover:bg-slate-100 font-bold"
                                    >
                                      +
                                    </button>
                                  </div>
                                  
                                  {/* Subtotal */}
                                  <span className="text-xs font-bold text-slate-900 font-display">
                                    {formatCurrency(itemPrice * item.quantity)}
                                  </span>
                                </div>
                              </div>

                              {/* Remove item button */}
                              <button
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="absolute right-2 top-2 text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Drawer Footer (Summary & Checkout Form) */}
                  {cart.length > 0 && (() => {
                    const cartTotal = cart.reduce((sum, item) => sum + (calculateFinalPrice(item.product) * item.quantity), 0);
                    const baseMinAdvance = Math.min(35, cartTotal);
                    const currentAdvance = checkoutAdvanceAmount !== '' ? Math.max(baseMinAdvance, Number(checkoutAdvanceAmount)) : baseMinAdvance;
                    const cartBalance = cartTotal - currentAdvance;

                    return (
                      <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-4 max-h-[60%] overflow-y-auto animate-fadeIn">
                        {/* Pricing Summary */}
                        <div className="space-y-1.5 text-xs bg-white p-3.5 rounded-2xl border border-slate-100 shadow-3xs">
                          <div className="flex justify-between text-slate-500 font-medium">
                            <span>Monto Total:</span>
                            <span className="text-slate-900 font-black font-display">
                              {formatCurrency(cartTotal)}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-500 font-medium items-center">
                            <span>Adelanto para reservar:</span>
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              <span className="text-slate-400 font-semibold text-[11px]">S/</span>
                              <input
                                type="number"
                                min={baseMinAdvance}
                                max={cartTotal}
                                value={checkoutAdvanceAmount !== '' ? checkoutAdvanceAmount : baseMinAdvance}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '') {
                                    setCheckoutAdvanceAmount('');
                                  } else {
                                    const num = Math.min(cartTotal, Math.max(0, parseInt(val) || 0));
                                    setCheckoutAdvanceAmount(num);
                                  }
                                }}
                                onBlur={() => {
                                  // enforce base minimum when they finish typing
                                  const num = Number(checkoutAdvanceAmount);
                                  if (checkoutAdvanceAmount === '' || num < baseMinAdvance) {
                                    setCheckoutAdvanceAmount(baseMinAdvance);
                                  }
                                }}
                                className="w-16 font-bold text-slate-900 border-none outline-hidden bg-transparent text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                          </div>
                          {checkoutAdvanceAmount !== '' && Number(checkoutAdvanceAmount) > baseMinAdvance && (
                            <div className="text-[10px] text-emerald-600 font-bold text-right leading-none">
                              ¡Adelanto voluntario mayor al mínimo de {formatCurrency(baseMinAdvance)}! 🌟
                            </div>
                          )}
                          <div className="flex justify-between text-slate-500 font-medium pt-1.5 border-t border-slate-100">
                            <span className="font-bold text-slate-700">Saldo pendiente al recibir:</span>
                            <span className="text-orange-600 font-black font-display text-sm">
                              {formatCurrency(cartBalance)}
                            </span>
                          </div>
                        </div>

                        {/* Checkout Form */}
                        <form onSubmit={handleCheckoutCart} className="space-y-3">
                          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Tus Datos para el Pedido:</span>
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={checkoutClientName}
                              onChange={(e) => setCheckoutClientName(e.target.value)}
                              placeholder="Nombre y Apellido completo"
                              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-orange-500"
                              required
                            />
                            <input
                              type="text"
                              value={checkoutClientPhone}
                              onChange={(e) => setCheckoutClientPhone(e.target.value)}
                              placeholder="Número de celular"
                              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-orange-500"
                              required
                            />

                            {/* Shipping Options */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Destino de Envío
                                </label>
                                <span className="text-[9px] font-extrabold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100/60 flex items-center gap-1">
                                  <span>Envío por Shalom 📦</span>
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShippingType('huancayo')}
                                  className={`p-2.5 rounded-xl border text-center transition-all duration-200 outline-hidden ${
                                    shippingType === 'huancayo'
                                      ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                                      : 'border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-[10px] font-extrabold text-slate-800 block">Huancayo</span>
                                  <span className="text-[8px] text-orange-600 font-extrabold block leading-none mt-1">Preferencial ⭐</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setShippingType('provincia')}
                                  className={`p-2.5 rounded-xl border text-center transition-all duration-200 outline-hidden ${
                                    shippingType === 'provincia'
                                      ? 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20'
                                      : 'border-slate-200 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-[10px] font-extrabold text-slate-800 block">Otras Provincias</span>
                                  <span className="text-[8px] text-slate-500 block leading-none mt-1">Especificar</span>
                                </button>
                              </div>
                            </div>

                            {/* Shipping Address Input / Info box */}
                            <div className="space-y-1">
                              {shippingType === 'provincia' ? (
                                <>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    Nombre de la Provincia de Destino *
                                  </label>
                                  <textarea
                                    value={shippingAddress}
                                    onChange={(e) => setShippingAddress(e.target.value)}
                                    placeholder="Ej: Arequipa - Enviar a Agencia Shalom Centro (Nombre: Alejandra, DNI: 12345678)"
                                    rows={2}
                                    className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-orange-500 resize-none animate-fadeIn"
                                    required
                                  />
                                  <p className="text-[9.5px] text-slate-500/90 leading-tight">
                                    📦 <strong>Nota:</strong> Los envíos a provincias se realizan a través de <strong>Shalom Agencia</strong> (pago en destino del envío).
                                  </p>
                                </>
                              ) : (
                                <div className="bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 space-y-1 animate-fadeIn">
                                  <p className="text-[10px] font-bold text-orange-800 flex items-center gap-1">
                                    🏡 Coordinación Interna en Huancayo
                                  </p>
                                  <p className="text-[9px] text-orange-700 leading-normal">
                                    No te preocupes por la dirección ahora. Coordinaremos los detalles del retiro, punto de encuentro o entrega en Huancayo de forma privada directamente contigo por WhatsApp. 🤝
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Yape/Plin disclaimer */}
                          <div className="bg-white/90 p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2 flex flex-col items-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Yape / Plin de reservas</p>
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full justify-between">
                              <div className="text-left">
                                <span className="text-xs text-orange-600 font-extrabold block tracking-wide">{settings.yapeNumber}</span>
                                <span className="text-[9px] text-slate-500 block">Titular: {settings.yapeName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(settings.yapeNumber);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all duration-300 ${
                                  copied
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-xs'
                                }`}
                              >
                                {copied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>¡Copiado!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Image receipt reminder */}
                          <div className="bg-orange-50/80 p-2.5 rounded-xl border border-orange-100/50 text-center">
                            <p className="text-[10px] font-extrabold text-orange-800 flex items-center justify-center gap-1">
                              📸 ¡En breve enviaré la imagen del pago!
                            </p>
                            <p className="text-[9px] text-orange-700 mt-0.5 leading-normal">
                              Al finalizar en WhatsApp, podrás enviar la captura de pantalla de tu Yape/Plin para confirmar tu reserva de inmediato.
                            </p>
                          </div>

                          <p className="text-[9.5px] text-slate-400 text-center leading-normal">
                            Al presionar el botón de abajo, registraremos tu pedido en nuestro sistema y te abriremos WhatsApp para que envíes el comprobante del adelanto.
                          </p>

                          {/* Checkout button */}
                          <button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-500/10 transition-colors flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-4 h-4 fill-white text-emerald-500" />
                            Confirmar Reserva por WhatsApp
                          </button>
                        </form>
                      </div>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ===================================================
          VISTA ADMIN (PRIVADA CON LOGIN)
          =================================================== */}
      {currentView === 'admin' && (
        <div className="bg-slate-100 min-h-screen flex flex-col">
          {/* Admin Header / Top Navigation */}
          <header className="bg-slate-900 text-white shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="bg-orange-500 text-white font-black text-xs px-2 py-1 rounded-md">ADMIN</span>
                <div>
                  <h1 className="text-sm font-extrabold font-display tracking-tight text-white flex items-center gap-1.5">
                    {settings.companyName} Panel
                    {supabaseStatus === 'connected' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                        ● Supabase Conectado
                      </span>
                    )}
                    {supabaseStatus === 'connecting' && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        ● Conectando...
                      </span>
                    )}
                    {supabaseStatus === 'error' && (
                      <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-rose-500/20" title="Hubo un error al conectar con Supabase. Revisa las variables.">
                        ● Error de Conexión
                      </span>
                    )}
                    {supabaseStatus === 'not_configured' && (
                      <span className="inline-flex items-center gap-1 bg-slate-500/10 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-slate-500/20" title="Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel">
                        ● Modo Local (Sin Servidor)
                      </span>
                    )}
                  </h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">Control de Negocio</p>
                </div>
              </div>

              {isLoggedIn && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setAdminSubTab('products')}
                    className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      adminSubTab === 'products'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    👟 Inventario
                  </button>
                  <button
                    onClick={() => setAdminSubTab('orders')}
                    className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      adminSubTab === 'orders'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    📦 Pedidos ({orders.length})
                  </button>
                  <button
                    onClick={() => setAdminSubTab('settings')}
                    className={`text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                      adminSubTab === 'settings'
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    ⚙️ Ajustes
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-800 hover:bg-red-500 hover:text-white text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Salir
                  </button>
                </div>
              )}

              {!isLoggedIn && (
                <button
                  onClick={() => navigateTo('catalog')}
                  className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg"
                >
                  Volver al Catálogo Público
                </button>
              )}
            </div>
          </header>

          {/* Main Workspace Container */}
          <div className="max-w-6xl w-full mx-auto px-4 py-8 flex-grow">
            {/* LOGIN PANEL */}
            {!isLoggedIn ? (
              <div className="max-w-sm mx-auto my-12 bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-extrabold font-display text-slate-900">Acceso Privado</h2>
                  <p className="text-xs text-slate-500">Inserta la contraseña administrativa para entrar al panel.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contraseña</label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setLoginError('');
                      }}
                      placeholder="••••••••"
                      className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-center font-bold tracking-widest"
                      required
                    />
                  </div>

                  {loginError && (
                    <p className="text-[11px] text-red-500 font-bold text-center animate-shake">
                      ⚠️ {loginError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-orange-500 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md shadow-slate-900/10"
                  >
                    Ingresar al Panel
                  </button>
                </form>

                <div className="text-center">
                  <button
                    onClick={() => navigateTo('catalog')}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline"
                  >
                    Volver al catálogo de clientes
                  </button>
                </div>
              </div>
            ) : (
              /* ADMIN INTERFACE (LOGGED IN) */
              <div className="space-y-8">
                {supabaseStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-3xl p-6 space-y-4 shadow-sm animate-fade-in">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 text-red-600 rounded-xl mt-0.5">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xs font-bold text-red-900">⚠️ Error de Sincronización con Supabase</h3>
                        <p className="text-[11px] text-red-700 leading-relaxed">
                          Has configurado las variables de entorno de Supabase, pero las tablas (<code>products</code>, <code>orders</code>, <code>settings</code>) no existen aún en tu base de datos de Supabase o no tienen los permisos correctos.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">🛠️ SQL de Configuración Rápida</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
                            alert('¡SQL de configuración copiado al portapapeles!');
                          }}
                          className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Script
                        </button>
                      </div>
                      <p className="text-[9.5px] text-slate-300 leading-normal">
                        Para solucionar esto en 5 segundos, ve a tu panel de Supabase &gt; <strong>SQL Editor</strong> &gt; presiona en <strong>New Query</strong> (Nueva consulta), pega el siguiente código y presiona <strong>RUN</strong>:
                      </p>
                      <pre className="text-[9px] font-mono bg-slate-950 p-3 rounded-xl max-h-48 overflow-y-auto border border-slate-800 text-slate-400 select-all leading-relaxed whitespace-pre">
                        {SUPABASE_SQL_SETUP}
                      </pre>
                      <div className="text-[9.5px] text-slate-400 border-t border-slate-800 pt-2.5 flex flex-col gap-1.5">
                        <p><strong>Paso adicional para que las fotos se vean en otros dispositivos:</strong></p>
                        <p>1. Ve a la pestaña <strong>Storage</strong> en tu panel izquierdo de Supabase.</p>
                        <p>2. Crea un nuevo Bucket llamado exactamente: <code className="bg-slate-800 text-orange-400 px-1 py-0.5 rounded font-mono">productos</code>.</p>
                        <p>3. Asegúrate de marcarlo como <strong>Public (Público)</strong> para que cualquier dispositivo pueda visualizar las imágenes subidas.</p>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[10px] text-amber-800 flex items-center gap-2">
                      <span>💡 <strong>Nota importante:</strong> Tus datos se siguen guardando localmente (Local Storage) para que no pierdas nada de tu trabajo. Una vez que ejecutes el SQL, todo se sincronizará automáticamente.</span>
                    </div>
                  </div>
                )}

                {/* Visual Sales / Business Metrics (Admin-Only Dashboard Insights) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Metric 1 */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Productos</span>
                      <ShoppingBag className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-xl font-black font-display text-slate-900">{products.length}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Zapatillas y buzos en catálogo</div>
                  </div>

                  {/* Metric 2 */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pedidos Activos</span>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-xl font-black font-display text-slate-900">{pendingDeliveriesCount}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Pendientes por despachar</div>
                  </div>

                  {/* Metric 3 */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Adelantos Recibidos</span>
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="text-xl font-black font-display text-emerald-600">S/ {totalAdvanceCollected.toLocaleString('es-PE')}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Total recaudado por reservas</div>
                  </div>

                  {/* Metric 4 */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Saldos por Cobrar</span>
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="text-xl font-black font-display text-slate-900">S/ {totalOutstandingBalance.toLocaleString('es-PE')}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Saldos pendientes al entregar</div>
                  </div>
                </div>

                {/* Main dynamic admin views switcher */}
                {adminSubTab === 'products' && (
                  <AdminProducts
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    supabaseStatus={supabaseStatus}
                  />
                )}

                {adminSubTab === 'orders' && (
                  <AdminOrders
                    orders={orders}
                    products={products}
                    settings={settings}
                    onAddOrder={handleAddOrder}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}

                {adminSubTab === 'settings' && (
                  <AdminSettingsPanel
                    settings={settings}
                    adminPassword={adminPassword}
                    onUpdateSettings={setSettings}
                    onUpdatePassword={setAdminPassword}
                  />
                )}
              </div>
            )}
          </div>

          {/* Admin Footer */}
          <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs mt-12 border-t border-slate-800">
            <p>© {new Date().getFullYear()} Tabitas Store - Panel de Control Administrativo Privado.</p>
            <button
              onClick={() => navigateTo('catalog')}
              className="text-orange-400 hover:text-orange-500 font-bold underline mt-2 inline-block"
            >
              ← Volver al Catálogo Público
            </button>
          </footer>
        </div>
      )}
    </div>
  );
}
