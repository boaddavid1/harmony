/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Search, Eye, Plus, Printer, RefreshCw, X, Check, DollarSign, Receipt,
  TrendingDown, Trash2, Calendar, Tag, Coins, User as UserIcon
} from 'lucide-react';
import { Invoice, Payment, PaymentMethod, User } from '../types';
import { apiFetch } from '../api_client';
import AddExpenseModal from './AddExpenseModal';

interface BillingViewProps {
  user: User | null;
  currency: string;
}

export default function BillingView({ user, currency }: BillingViewProps) {
  const isAccountantOrAdmin = user?.role === 'Admin' || user?.role === 'Accountant' || user?.role === 'Receptionist';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPaid, setFilterPaid] = useState<string>('All');

  // Selected Invoice Modal / Folio Printout
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Record Payment Modal Form states
  const [showPayModal, setShowPayModal] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses'>('invoices');

  // Expense States
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingReceiptName, setViewingReceiptName] = useState<string | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const invData = await apiFetch('/api/invoices');
      const payData = await apiFetch('/api/payments');
      const resData = await apiFetch('/api/reservations');
      const guestsData = await apiFetch('/api/guests');
      const expData = await apiFetch('/api/expenses').catch(() => []);
      setInvoices(invData);
      setPayments(payData);
      setReservations(resData);
      setGuests(guestsData);
      setExpenses(expData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await apiFetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting expense.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsLoading(true);
    try {
      const data = await apiFetch(`/api/invoices/${invoice.id}`);
      // Find guest and reservation details
      const reservation = reservations.find(r => r.id === invoice.reservationId);
      const guest = reservation ? guests.find(g => g.id === reservation.guestId) : null;
      setInvoiceDetails({
        ...data,
        guest,
        reservation
      });
    } catch (e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenPay = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayInvoiceId(invoice.id);
    // Auto populate remaining outstanding balance
    const relatedPayments = payments.filter(p => p.invoiceId === invoice.id);
    const paidAmount = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = Math.max(0, invoice.grandTotal - paidAmount);
    
    setPayAmount(outstanding.toString());
    setPayMethod('Cash');
    setPayReference('PAY-' + Date.now().toString().slice(-6));
    setPayNotes('');
    setPayError('');
    setShowPayModal(true);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError('');

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }

    const payload = {
      invoiceId: payInvoiceId,
      amount: amountNum,
      paymentMethod: payMethod,
      referenceNumber: payReference,
      notes: payNotes
    };

    try {
      await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowPayModal(false);
      fetchData();
      
      // If folio is currently open, refresh details
      if (selectedInvoice && selectedInvoice.id === payInvoiceId) {
        handleSelectInvoice(selectedInvoice);
      }
    } catch (err: any) {
      setPayError(err.message || 'Error recording payment transaction.');
    }
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Invoice - ${selectedInvoice?.invoiceNumber}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @media print {
                  body { padding: 20px; color: #000; }
                }
              </style>
            </head>
            <body class="bg-white p-8">
              ${printContent}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const reservation = reservations.find(r => r.id === inv.reservationId);
    const guest = reservation ? guests.find(g => g.id === reservation.guestId) : null;
    const guestName = guest ? guest.fullName.toLowerCase() : '';
    
    const matchesSearch = 
      guestName.includes(searchQuery.toLowerCase()) || 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPaid = 
      filterPaid === 'All' || 
      (filterPaid === 'Paid' && inv.isPaid) || 
      (filterPaid === 'Unpaid' && !inv.isPaid);

    return matchesSearch && matchesPaid;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Retrieving ledger invoices & transaction journals...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col font-sans relative" id="billing_view_container">
      
      {/* Top Banner and Search filters */}
      <div className="p-6 border-b border-slate-200 bg-white flex flex-col gap-5 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="h-5.5 w-5.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Billing & Payment Hub</h2>
              <p className="text-xs text-slate-500 font-medium">Generate folios, post service payments, and export professional printable customer invoices.</p>
            </div>
          </div>

          {/* Tab switches */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'invoices' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Invoices & Billing
            </button>
            <button
              onClick={() => {
                setActiveTab('expenses');
                setSelectedInvoice(null);
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'expenses' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Expense Journal
            </button>
          </div>
        </div>

        {/* Dynamic filters based on active tab */}
        {activeTab === 'invoices' ? (
          <div className="flex flex-wrap gap-3 items-center w-full">
            <div className="relative w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="billing_search_input"
                type="text"
                placeholder="Search invoices by code or guest name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterPaid}
              onChange={(e) => setFilterPaid(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Invoices</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid / Outstanding</option>
            </select>
          </div>
        ) : (
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-3 items-center">
              <p className="text-xs text-slate-500 font-medium">Track operational hotel expenses and outflows to calculate precise net profit margins.</p>
            </div>
            {(user?.role === 'Admin' || user?.role === 'Accountant') && (
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Record Hotel Expense
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid: Split Table with interactive sidebar */}
      <div className="flex-1 flex overflow-hidden">
        
        {activeTab === 'invoices' ? (
          /* Invoice list table */
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse animate-fade-in">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                    <th className="p-4">Invoice Number</th>
                    <th className="p-4">Guest Reference</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4">Amount Due</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 text-sm">
                        No matching invoice accounts logged.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const reservation = reservations.find(r => r.id === inv.reservationId);
                      const guest = reservation ? guests.find(g => g.id === reservation.guestId) : null;
                      const relatedPayments = payments.filter(p => p.invoiceId === inv.id);
                      const totalPaid = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
                      const balance = inv.grandTotal - totalPaid;

                      return (
                        <tr 
                          key={inv.id}
                          onClick={() => handleSelectInvoice(inv)}
                          className={`hover:bg-slate-50/75 transition-all cursor-pointer ${selectedInvoice?.id === inv.id ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="p-4 font-mono font-bold text-slate-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="p-4">
                            <p className="font-semibold text-slate-800">{guest ? guest.fullName : 'Unknown Guest'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Res: {inv.reservationId.split('_')[1]}</p>
                          </td>
                          <td className="p-4 text-slate-500 font-medium">{inv.issueDate}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-800">{currency}{inv.grandTotal.toLocaleString()}</p>
                            {balance > 0 ? (
                              <p className="text-[10px] text-red-500 font-semibold mt-0.5">Due: {currency}{balance.toLocaleString()}</p>
                            ) : (
                              <p className="text-[10px] text-emerald-600 font-semibold uppercase mt-0.5">Fully Settled</p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                              inv.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {inv.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {!inv.isPaid && isAccountantOrAdmin && (
                                <button
                                  onClick={(e) => handleOpenPay(inv, e)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  Record Payment
                                </button>
                              )}
                              <button
                                onClick={() => handleSelectInvoice(inv)}
                                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200"
                              >
                                <Eye className="h-3.5 w-3.5" />
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
        ) : (
          /* Expense Ledger layout */
          <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {/* KPI Cards for expenses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Expenses Outflow</p>
                  <p className="text-xl font-bold font-display text-slate-800 mt-1">
                    {currency}{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Expense Count</p>
                  <p className="text-xl font-bold font-display text-slate-800 mt-1">
                    {expenses.length} Records
                  </p>
                </div>
              </div>
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-lg">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Last Recorded Expense</p>
                  <p className="text-xs font-bold text-slate-800 mt-1 max-w-[200px] truncate">
                    {expenses.length > 0 ? expenses[expenses.length - 1].description : 'No records yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse animate-fade-in">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                    <th className="p-4">Description</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Expense Date</th>
                    <th className="p-4">Recorded By</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 text-sm">
                        No operational expenses logged.
                      </td>
                    </tr>
                  ) : (
                    [...expenses].reverse().map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/75 transition-all">
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{exp.description}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {exp.id}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 flex items-center gap-1 w-max">
                            <Tag className="h-2.5 w-2.5 text-slate-400" />
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-600">
                            <UserIcon className="h-3.5 w-3.5 text-slate-300" />
                            {exp.recordedBy}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-red-600 font-mono">
                          {currency}{exp.amount.toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          {exp.attachment && (
                            <button
                              onClick={() => {
                                setViewingReceiptUrl(exp.attachment);
                                setViewingReceiptName(exp.attachmentName || 'Receipt');
                              }}
                              className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-md transition-all cursor-pointer mr-1"
                              title="View Attached Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                          {(user?.role === 'Admin' || user?.role === 'Accountant') && (
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-all cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Invoice Folio Side Panel */}
        {selectedInvoice && (
          <div className="w-[450px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-in relative z-10">
            {/* Header toolbar */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Receipt className="h-4.5 w-4.5 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 font-display uppercase tracking-wide">Guest Bill Folio</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrint}
                  disabled={detailsLoading || !invoiceDetails}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 disabled:opacity-50 transition-all cursor-pointer"
                  title="Print Folio Bill"
                >
                  <Printer className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Folio View body */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar text-xs">
              {detailsLoading || !invoiceDetails ? (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  <span className="text-slate-400">Loading Folio logs...</span>
                </div>
              ) : (
                /* Print block wrapper */
                <div ref={printAreaRef} className="space-y-6 font-sans">
                  
                  {/* Brand billing block */}
                  <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-display">Grand Horizon Resort & Spa</h4>
                      <p className="text-[10px] text-slate-400 leading-normal mt-0.5">
                        777 Ocean Breeze Blvd, Miami, FL<br />
                        Phone: (305) 555-9000
                      </p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">Folio Statement</h4>
                      <p className="text-sm font-bold text-slate-700 font-mono mt-1">{invoiceDetails.invoice.invoiceNumber}</p>
                    </div>
                  </div>

                  {/* Customer Information detail */}
                  <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 font-mono block">Bill To:</span>
                      <p className="font-bold text-slate-800 mt-1">{invoiceDetails.guest?.fullName || 'Guest'}</p>
                      <p className="text-slate-500 mt-0.5">{invoiceDetails.guest?.email}</p>
                      <p className="text-slate-500">{invoiceDetails.guest?.phone}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 font-mono block">Stay Reference:</span>
                      <p className="font-semibold text-slate-700 mt-1">Check-in: {invoiceDetails.reservation?.checkInDate}</p>
                      <p className="font-semibold text-slate-700">Check-out: {invoiceDetails.reservation?.checkOutDate}</p>
                    </div>
                  </div>

                  {/* Items Invoice billing breakdown */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-400 uppercase font-mono text-[9px] tracking-wider border-b border-slate-100 pb-1">Ledging Charges</h5>
                    <div className="divide-y divide-slate-100">
                      {invoiceDetails.items.map((item: any) => (
                        <div key={item.id} className="py-2.5 flex justify-between items-baseline text-[11px]">
                          <div className="max-w-[280px]">
                            <p className="font-semibold text-slate-800">{item.description}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Qty: {item.quantity} x {currency}{item.unitPrice}</p>
                          </div>
                          <span className="font-bold text-slate-700">{currency}{item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Total block summary */}
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Room Subtotal:</span>
                      <span>{currency}{invoiceDetails.invoice.subTotal.toLocaleString()}</span>
                    </div>
                    {invoiceDetails.invoice.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Corporate Discount:</span>
                        <span>-{currency}{invoiceDetails.invoice.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>VAT Taxes (15%):</span>
                      <span>{currency}{invoiceDetails.invoice.taxAmount.toLocaleString()}</span>
                    </div>
                    
                    {/* Grand Total */}
                    <div className="flex justify-between items-baseline border-t border-slate-200 border-double pt-2.5 mt-1 text-slate-900 text-sm font-bold font-display">
                      <span>Grand Total:</span>
                      <span>{currency}{invoiceDetails.invoice.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Payments Log Details */}
                  <div className="border-t border-slate-200 pt-4 space-y-3">
                    <h5 className="font-bold text-slate-400 uppercase font-mono text-[9px] tracking-wider border-b border-slate-100 pb-1">Posted Payments Journal</h5>
                    
                    {invoiceDetails.payments.length === 0 ? (
                      <p className="text-slate-400 italic py-2">No payment transactions recorded yet.</p>
                    ) : (
                      <div className="space-y-2 text-[11px]">
                        {invoiceDetails.payments.map((p: any) => (
                          <div key={p.id} className="p-2.5 bg-emerald-50/40 border border-emerald-100/50 rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-emerald-800">{p.paymentMethod} Payment</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Ref: {p.referenceNumber} &bull; {new Date(p.paymentDate).toLocaleDateString()}</p>
                            </div>
                            <span className="font-bold text-emerald-700">-{currency}{p.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Outstanding Balance */}
                    {(() => {
                      const totalPaid = invoiceDetails.payments.reduce((sum: number, p: any) => sum + p.amount, 0);
                      const balance = invoiceDetails.invoice.grandTotal - totalPaid;
                      return (
                        <div className={`p-3 rounded-lg border flex justify-between items-center font-display ${balance <= 0 ? 'bg-emerald-100/30 border-emerald-200 text-emerald-800' : 'bg-rose-50/50 border-rose-200 text-rose-800'}`}>
                          <span className="font-bold uppercase font-mono tracking-wider text-[9px]">Outstanding Balance Due:</span>
                          <span className="text-sm font-bold">{currency}{Math.max(0, balance).toLocaleString()}</span>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Record Payment Form Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Record Transaction Payment</h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg font-semibold">
                {payError}
              </div>
            )}

            <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Payment Amount ({currency})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Reference Number</label>
                <input
                  type="text"
                  required
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Transaction Notes / Memorandums</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Additional receipt annotations..."
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                Post Payment Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Form Modal */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSuccess={fetchData}
        currency={currency}
      />

      {/* View Receipt Modal */}
      {viewingReceiptUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-xs">
            <div className="flex justify-between items-center bg-slate-50 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4.5 w-4.5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Receipt Attachment: {viewingReceiptName}</h3>
              </div>
              <button 
                onClick={() => {
                  setViewingReceiptUrl(null);
                  setViewingReceiptName(null);
                }} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 flex items-center justify-center bg-slate-100 max-h-[70vh] overflow-auto">
              {viewingReceiptUrl.startsWith('data:application/pdf') ? (
                <object data={viewingReceiptUrl} type="application/pdf" className="w-full h-[60vh] rounded-lg">
                  <embed src={viewingReceiptUrl} type="application/pdf" />
                </object>
              ) : viewingReceiptUrl.startsWith('data:image/') ? (
                <img src={viewingReceiptUrl} alt="Receipt" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm" />
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-500 font-medium mb-4">Attachment cannot be previewed in the browser.</p>
                  <a 
                    href={viewingReceiptUrl} 
                    download={viewingReceiptName || 'receipt'} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md"
                  >
                    Download Receipt
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  setViewingReceiptUrl(null);
                  setViewingReceiptName(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
