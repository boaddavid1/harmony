/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Trash2, Search, Plus, Minus, CreditCard, 
  DollarSign, Smartphone, User, Check, RefreshCw, AlertCircle, 
  Sparkles, Tag, Layers, PlusCircle, Receipt, ArrowRight, Wallet
} from 'lucide-react';
import { apiFetch } from '../api_client';
import { User as UserType } from '../types';

interface POSProduct {
  id: string;
  name: string;
  category: 'Beverages' | 'Snacks' | 'Toiletries' | 'Amenities' | 'Services';
  price: number;
}

const DEFAULT_PRODUCTS: POSProduct[] = [
  { id: 'p_water', name: 'Premium Bottled Water', category: 'Beverages', price: 10 },
  { id: 'p_coke', name: 'Coca-Cola Can', category: 'Beverages', price: 15 },
  { id: 'p_sprite', name: 'Sprite Can', category: 'Beverages', price: 15 },
  { id: 'p_juice', name: 'Fresh Tropical Juice', category: 'Beverages', price: 25 },
  { id: 'p_chips', name: 'Potato Chips / Pringles', category: 'Snacks', price: 35 },
  { id: 'p_nuts', name: 'Roasted Cashew Nuts', category: 'Snacks', price: 30 },
  { id: 'p_choc', name: 'Local Artisan Chocolate', category: 'Snacks', price: 18 },
  { id: 'p_cookies', name: 'Choco-Chip Cookies', category: 'Snacks', price: 20 },
  { id: 'p_shampoo', name: 'Travel Toiletries Kit', category: 'Toiletries', price: 25 },
  { id: 'p_dental', name: 'Toothbrush & Paste Set', category: 'Toiletries', price: 20 },
  { id: 'p_sunscreen', name: 'Sunscreen Lotion', category: 'Toiletries', price: 45 },
  { id: 'p_cap', name: 'Horizon Swimming Cap', category: 'Amenities', price: 40 },
  { id: 'p_pass', name: 'Pool Day Pass', category: 'Amenities', price: 50 },
  { id: 'p_keyring', name: 'Souvenir Logo Keyring', category: 'Amenities', price: 15 },
  { id: 'p_late', name: 'Late Check-out (2 Hours)', category: 'Services', price: 120 },
  { id: 'p_laundry', name: 'Express Laundry Service', category: 'Services', price: 80 },
  { id: 'p_iron', name: 'Express Steam Pressing', category: 'Services', price: 30 },
];

interface POSTerminalProps {
  user: UserType | null;
  currency: string;
  onSuccess: () => void;
}

interface CartItem {
  product: POSProduct;
  quantity: number;
}

export default function POSTerminal({ user, currency, onSuccess }: POSTerminalProps) {
  const [products, setProducts] = useState<POSProduct[]>(DEFAULT_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Custom item inputs
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCategory, setCustomCategory] = useState<'Beverages' | 'Snacks' | 'Toiletries' | 'Amenities' | 'Services'>('Beverages');

  // Checkout states
  const [transactionType, setTransactionType] = useState<'direct' | 'room-charge'>('direct');
  const [checkedInGuests, setCheckedInGuests] = useState<any[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile Money' | 'Bank Transfer'>('Cash');
  
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch checked-in guests for Room Charge option
  const fetchCheckedInGuests = async () => {
    setIsLoadingGuests(true);
    try {
      const reservations = await apiFetch('/api/reservations');
      const guests = await apiFetch('/api/guests');
      
      const activeReservations = reservations
        .filter((r: any) => r.bookingStatus === 'Checked-in')
        .map((r: any) => {
          const guest = guests.find((g: any) => g.id === r.guestId);
          return {
            reservationId: r.id,
            guestName: guest ? guest.fullName : 'Unknown Guest',
            rooms: r.rooms || [],
            invoiceId: r.invoiceId
          };
        });

      setCheckedInGuests(activeReservations);
      if (activeReservations.length > 0) {
        setSelectedReservationId(activeReservations[0].reservationId);
      }
    } catch (e) {
      console.error('Failed to fetch active guests:', e);
    } finally {
      setIsLoadingGuests(false);
    }
  };

  useEffect(() => {
    if (transactionType === 'room-charge') {
      fetchCheckedInGuests();
    }
  }, [transactionType]);

  // Product categories
  const categories = ['All', 'Beverages', 'Snacks', 'Toiletries', 'Amenities', 'Services'];

  // Add item to cart
  const addToCart = (product: POSProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setStatusMessage(null);
  };

  // Remove or decrement item from cart
  const decrementCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(item => item.product.id !== productId);
      }
      return prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Add custom item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPrice || isNaN(Number(customPrice))) return;

    const newProduct: POSProduct = {
      id: 'custom_' + Date.now(),
      name: customName,
      category: customCategory,
      price: Math.abs(Number(customPrice))
    };

    addToCart(newProduct);
    setCustomName('');
    setCustomPrice('');
  };

  // Calculations
  const taxRate = 0.15; // 15% VAT
  const subTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const taxAmount = Math.round(subTotal * taxRate * 100) / 100;
  const grandTotal = subTotal + taxAmount;

  // Handle Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (transactionType === 'room-charge' && !selectedReservationId) {
      setStatusMessage({ type: 'error', text: 'Please select an active guest room.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const checkoutItems = cart.map(item => ({
      description: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price
    }));

    try {
      const response = await apiFetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionType,
          items: checkoutItems,
          reservationId: transactionType === 'room-charge' ? selectedReservationId : undefined,
          paymentMethod: transactionType === 'direct' ? paymentMethod : undefined
        })
      });

      if (response.success) {
        setCart([]);
        setStatusMessage({
          type: 'success',
          text: transactionType === 'room-charge' 
            ? 'Success! Sale added directly to the guest room invoice.' 
            : 'Success! POS Direct Sale completed and transaction recorded.'
        });
        onSuccess(); // Trigger metrics updates
      } else {
        setStatusMessage({ type: 'error', text: response.error || 'Failed to complete POS transaction.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error communicating with POS checkout.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Products Stage (Left Column) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Search & Categories Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search frontdesk inventory (e.g. water, pass, laundry)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            
            {/* Category Filter Pills */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border border-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(prod => {
            const inCart = cart.find(item => item.product.id === prod.id);
            return (
              <div 
                key={prod.id} 
                onClick={() => addToCart(prod)}
                className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:shadow-md hover:border-blue-100 transition-all cursor-pointer flex flex-col justify-between group relative min-h-[120px]"
              >
                {inCart && (
                  <span className="absolute top-2 right-2 bg-blue-600 text-white font-mono font-bold text-[10px] h-5 px-1.5 rounded-full flex items-center justify-center animate-pulse">
                    {inCart.quantity}x
                  </span>
                )}
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {prod.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-700 mt-1 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {prod.name}
                  </h4>
                </div>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {currency}{prod.price}
                  </span>
                  <span className="text-[10px] text-blue-500 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Add <Plus className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              No matching retail items found. Add a custom item below.
            </div>
          )}
        </div>

        {/* Quick Custom Charge Addition Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3.5">
            <PlusCircle className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-700">Add Custom Charge / Miscellaneous Item</h4>
          </div>
          <form onSubmit={handleAddCustomItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Item name (e.g. Late Room Charge, Airport Shuttle)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-medium"
                required
              />
            </div>
            <div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">{currency}</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Cart & Checkout Terminal (Right Column) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5 min-h-[500px]">
        
        {/* Cart Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5 text-blue-600" />
            <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">POS Basket</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Cart Items list */}
        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-slate-400 gap-2">
              <ShoppingCart className="h-8 w-8 text-slate-200 stroke-[1.5]" />
              <p className="text-xs font-semibold">Your sales basket is empty</p>
              <p className="text-[10px] max-w-[180px] text-slate-400">Select items from the catalog or add a custom charge to begin checkout.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100/70 group">
                <div className="min-w-0 flex-1 pr-2">
                  <h5 className="text-xs font-bold text-slate-700 truncate" title={item.product.name}>
                    {item.product.name}
                  </h5>
                  <p className="text-[10px] font-mono font-medium text-slate-400 mt-0.5">
                    {currency}{item.product.price} × {item.quantity}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-2xs overflow-hidden">
                    <button 
                      onClick={() => decrementCart(item.product.id)}
                      className="p-1 hover:bg-slate-50 text-slate-500 cursor-pointer border-r border-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 font-mono font-semibold text-xs text-slate-800">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => addToCart(item.product.id ? item.product : item.product)}
                      className="p-1 hover:bg-slate-50 text-slate-500 cursor-pointer border-l border-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-300 hover:text-red-500 cursor-pointer rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculations Block */}
        <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600 font-medium">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono text-slate-800 font-bold">{currency}{subTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>VAT / Taxes (15%)</span>
            <span className="font-mono font-bold">{currency}{taxAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-dashed border-slate-100 pt-2.5">
            <span className="font-display uppercase tracking-wide">Grand Total</span>
            <span className="font-mono text-blue-600 font-extrabold">{currency}{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Checkout Options Form */}
        {cart.length > 0 && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            
            {/* Transaction Type Choice */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Billing Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType('direct')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                    transactionType === 'direct'
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-3xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Direct Payment
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType('room-charge')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                    transactionType === 'room-charge'
                      ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-3xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Charge to Room
                </button>
              </div>
            </div>

            {/* Room Charge Guest Dropdown */}
            {transactionType === 'room-charge' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Select Occupied Room & Guest
                </label>
                {isLoadingGuests ? (
                  <div className="py-2 text-slate-400 text-[11px] flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Fetching active guests...
                  </div>
                ) : checkedInGuests.length === 0 ? (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 rounded-lg p-2 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    No checked-in reservations currently in the system.
                  </p>
                ) : (
                  <select
                    value={selectedReservationId}
                    onChange={(e) => setSelectedReservationId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden font-semibold"
                  >
                    {checkedInGuests.map(g => (
                      <option key={g.reservationId} value={g.reservationId}>
                        Room {g.rooms.join(', ')} — {g.guestName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Direct Payment Method Buttons */}
            {transactionType === 'direct' && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', icon: DollarSign },
                    { id: 'Card', label: 'Card', icon: CreditCard },
                    { id: 'Mobile Money', label: 'MoMo', icon: Smartphone },
                    { id: 'Bank Transfer', label: 'Transfer', icon: Wallet }
                  ].map(method => {
                    const MethodIcon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex items-center gap-2 py-2 px-3 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                        }`}
                      >
                        <MethodIcon className="h-3.5 w-3.5" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              onClick={handleCheckout}
              disabled={isSubmitting || (transactionType === 'room-charge' && checkedInGuests.length === 0)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Checkout...</span>
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4" />
                  <span>
                    Checkout Sale ({currency}{grandTotal.toLocaleString()})
                  </span>
                </>
              )}
            </button>

          </div>
        )}

        {/* POS Status Messages */}
        {statusMessage && (
          <div className={`p-4 rounded-xl text-xs flex items-start gap-2 border animate-fade-in ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-medium' 
              : 'bg-red-50 border-red-100 text-red-700 font-medium'
          }`}>
            {statusMessage.type === 'success' ? (
              <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p>{statusMessage.text}</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
