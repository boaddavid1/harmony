/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, Hotel, Percent, HelpCircle, 
  MapPin, Phone, Mail, Globe, Sparkles
} from 'lucide-react';
import { apiFetch } from '../api_client';

interface SettingsViewProps {
  onSettingsUpdate: () => void;
}

export default function SettingsView({ onSettingsUpdate }: SettingsViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hotelName, setHotelName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [vatTaxRate, setVatTaxRate] = useState('15');

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/settings');
      setHotelName(data.hotelName || '');
      setAddress(data.address || data.hotelAddress || '');
      setPhone(data.phone || data.hotelPhone || '');
      setEmail(data.email || data.hotelEmail || '');
      setWebsite(data.website || '');
      setCurrencySymbol(data.currencySymbol || data.currency || '$');
      setVatTaxRate((data.vatTaxRate !== undefined ? data.vatTaxRate : (data.taxRate !== undefined ? data.taxRate * 100 : 15)).toString());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const payload = {
      hotelName,
      address,
      phone,
      email,
      website,
      currencySymbol,
      vatTaxRate: parseFloat(vatTaxRate)
    };

    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setMessage('System configuration parameters committed and synchronized successfully!');
      onSettingsUpdate();
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || 'Error saving parameters.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Querying central hotel configurations...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6 no-scrollbar font-sans" id="settings_view_container">
      
      {/* Title Block */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <Settings className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">System Configuration</h2>
            <p className="text-xs text-slate-500 font-medium">Coordinate hotel details, modify financial tax matrices, and configure default currency tokens.</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${isError ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'}`}>
          {message}
        </div>
      )}

      {/* Settings Grid Panel */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        
        {/* Brand identity panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Hotel className="h-4.5 w-4.5 text-blue-500" />
            <span>Resort Brand Profile</span>
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Hotel Resort Name</label>
            <input
              type="text"
              required
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Customer Support Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Customer Inquiries Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Physical Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Website URL</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Financial rates block */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <Percent className="h-4.5 w-4.5 text-blue-500" />
              <span>Financial & Taxes Matrix</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Default Currency Token</label>
              <input
                type="text"
                required
                maxLength={3}
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-mono text-center font-bold w-20"
              />
              <p className="text-[10px] text-slate-400 font-medium">Standard currency indicator (e.g. $, €, £, RWF).</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Value Added Tax (VAT) rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={vatTaxRate}
                onChange={(e) => setVatTaxRate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-mono text-center font-bold w-20"
              />
              <p className="text-[10px] text-slate-400 font-medium">Percentage posted onto stay invoices automatically.</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Synchronize Configuration</span>
          </button>
        </div>

      </form>

    </div>
  );
}
