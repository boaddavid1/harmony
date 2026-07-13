/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Calendar, FileText, Printer, ArrowRight, RefreshCw, CheckCircle, 
  Coins, LayoutDashboard, Key, TrendingUp, TrendingDown, Receipt
} from 'lucide-react';
import { apiFetch } from '../api_client';
import { User } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface ReportsViewProps {
  user: User | null;
  currency: string;
}

export default function ReportsView({ user, currency }: ReportsViewProps) {
  const [reportType, setReportType] = useState<'revenue' | 'reservations' | 'occupancy'>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiFetch('/api/settings');
        setSettings(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const EXPENSE_COLORS = [
    '#f59e0b', // Amber (Utilities)
    '#ef4444', // Red (Maintenance)
    '#3b82f6', // Blue (Salaries & Wages)
    '#10b981', // Emerald (Supplies)
    '#ec4899', // Pink (Marketing)
    '#8b5cf6', // Purple (Food & Beverage)
    '#06b6d4', // Cyan (Insurance)
    '#6366f1', // Indigo (Taxes)
    '#64748b'  // Slate (Others)
  ];

  const getReportExpensePieData = (expensesList: any[] = []) => {
    const categoryTotals: { [key: string]: number } = {};
    expensesList.forEach(e => {
      const cat = e.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
    });
    
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        type: reportType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      });
      const data = await apiFetch(`/api/reports?${queryParams}`);
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set default dates: past 30 days
    const today = new Date();
    const past30 = new Date();
    past30.setDate(past30.getDate() - 30);
    setStartDate(past30.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [reportType, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6 no-scrollbar font-sans" id="reports_view_container">
      
      {/* Upper banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <BarChart3 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Financial & Occupancy Audits</h2>
            <p className="text-xs text-slate-500 font-medium">Extract system analytics, monitor lodging volumes, and evaluate room usage statuses.</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          disabled={isLoading || !reportData}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Print Audit Report</span>
        </button>
      </div>

      {/* Date Filters block */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between print:hidden">
        
        {/* Report Selector tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setReportType('revenue')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${reportType === 'revenue' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Revenue Report
          </button>
          <button
            onClick={() => setReportType('reservations')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${reportType === 'reservations' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Bookings Ledger
          </button>
          <button
            onClick={() => setReportType('occupancy')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${reportType === 'occupancy' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Occupancy Percentage
          </button>
        </div>

        {/* Date Ranges inputs */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none bg-slate-50"
            />
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none bg-slate-50"
          />
        </div>

      </div>

      {/* Report Summary Dashboard */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
          <span className="text-sm text-slate-500">Compiling report data points...</span>
        </div>
      ) : !reportData ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 text-sm">
          Please specify a valid date range to inspect audit summaries.
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          
          {/* Print only header */}
          <div className="hidden print:block border-b border-slate-200 pb-4 mb-6">
            <h1 className="text-xl font-bold">{settings?.hotelName || 'Grand Horizon'} Hotel System Audit Statement</h1>
            <p className="text-xs text-slate-500 mt-1">
              Report type: <span className="font-bold uppercase font-mono">{reportType}</span> &bull; Period: {startDate} to {endDate}
            </p>
          </div>

          {/* Revenue Report Render */}
          {reportType === 'revenue' && (
            <div className="space-y-6">
              {/* Financial KPI overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cash Inflow Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Cash Inflow</span>
                    <h3 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{currency}{(reportData.total || 0).toLocaleString()}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{(reportData.payments || []).length} transaction postings.</p>
                  </div>
                </div>

                {/* Cash Outflow Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-red-50 text-red-600">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total Expenses Outflow</span>
                    <h3 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{currency}{(reportData.totalExpenses || 0).toLocaleString()}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{(reportData.expenses || []).length} expense records logged.</p>
                  </div>
                </div>

                {/* Net Profit Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${(reportData.netProfit || 0) >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {(reportData.netProfit || 0) >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Net Operational Balance</span>
                    <h3 className={`text-2xl font-bold font-display mt-0.5 ${(reportData.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {(reportData.netProfit || 0) < 0 ? '-' : ''}{currency}{Math.abs(reportData.netProfit || 0).toLocaleString()}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Net profit margins after operational expenses.</p>
                  </div>
                </div>
              </div>

              {/* Expense Distribution Chart Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Outflow Pie Chart */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500">
                    Expense Outflow Categories
                  </h4>
                  {(!reportData.expenses || reportData.expenses.length === 0) ? (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-xs py-10 min-h-[200px]">
                      No operational expenses in selected period.
                    </div>
                  ) : (
                    <div className="h-[200px] relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getReportExpensePieData(reportData.expenses)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {getReportExpensePieData(reportData.expenses).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`${currency}${value.toLocaleString()}`, 'Total Outflow']}
                            contentStyle={{ fontSize: '11px', borderRadius: '6px' }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Outflow</span>
                        <span className="text-xs font-extrabold text-slate-800 mt-0.5">{currency}{(reportData.totalExpenses || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Breakdown List */}
                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500">
                    Category Breakdown Analysis
                  </h4>
                  {(!reportData.expenses || reportData.expenses.length === 0) ? (
                    <div className="flex-grow flex items-center justify-center text-slate-400 text-xs py-10 min-h-[200px]">
                      No category metrics available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
                      {getReportExpensePieData(reportData.expenses).map((item: any, index: number) => {
                        const pct = reportData.totalExpenses > 0 ? ((item.value / reportData.totalExpenses) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }} />
                              <span className="text-xs font-semibold text-slate-700 truncate">{item.name}</span>
                            </div>
                            <div className="text-right font-mono text-xs pl-2">
                              <span className="font-bold text-slate-800">{currency}{item.value.toLocaleString()}</span>
                              <span className="text-slate-400 font-bold text-[10px] ml-1.5">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Transactions list */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2">
                    <Coins className="h-4 w-4 text-emerald-500" />
                    Transaction Postings Journal (Inflow)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Cash Inflow Log</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                      <th className="p-4">Payment Date</th>
                      <th className="p-4">Invoice Ref</th>
                      <th className="p-4">Method</th>
                      <th className="p-4">Reference No</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!reportData.payments || reportData.payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No payment records logged in this period.</td>
                      </tr>
                    ) : (
                      reportData.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-medium text-slate-600">
                            {new Date(p.paymentDate).toLocaleDateString()} {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 font-bold text-slate-500">{p.invoiceId}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{p.paymentMethod}</span>
                          </td>
                          <td className="p-4 font-mono text-slate-500">{p.referenceNumber}</td>
                          <td className="p-4 text-right font-bold text-slate-800">{currency}{p.amount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recorded Expenses (Outflow) List */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Recorded Expenses Journal (Outflow)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Cash Outflow Log</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                      <th className="p-4">Expense Date</th>
                      <th className="p-4">Description</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Logged By</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {!reportData.expenses || reportData.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No operational expenses logged in this period.</td>
                      </tr>
                    ) : (
                      reportData.expenses.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-medium text-slate-600 font-mono">
                            {new Date(e.date).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{e.description}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{e.category}</span>
                          </td>
                          <td className="p-4 text-slate-500 font-medium">{e.recordedBy}</td>
                          <td className="p-4 text-right font-bold text-red-600 font-mono">{currency}{e.amount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings Ledger Render */}
          {reportType === 'reservations' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Total Reservations</span>
                    <h3 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{reportData.count} bookings</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Created and drafted across selected range.</p>
                  </div>
                </div>
              </div>

              {/* Reservations table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500">Reservations Created</h4>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                      <th className="p-4">Reservation ID</th>
                      <th className="p-4">Stay Dates</th>
                      <th className="p-4">Guest Ref</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.reservations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">No bookings created in this period.</td>
                      </tr>
                    ) : (
                      reportData.reservations.map((res: any) => (
                        <tr key={res.id} className="hover:bg-slate-50/50">
                          <td className="p-4 font-mono font-bold text-slate-500">#{res.id.split('_')[1] || res.id}</td>
                          <td className="p-4 text-slate-600 font-medium">{res.checkInDate} to {res.checkOutDate}</td>
                          <td className="p-4 text-slate-500">{res.guestId}</td>
                          <td className="p-4">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded uppercase text-slate-600">{res.bookingStatus}</span>
                          </td>
                          <td className="p-4 text-right font-bold text-slate-800">{currency}{res.totalPrice.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Occupancy stats render */}
          {reportType === 'occupancy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                    <Key className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Active Occupancy Rate</span>
                    <h3 className="text-2xl font-bold text-slate-900 font-display mt-0.5">{reportData.rate}%</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{reportData.occupied} out of {reportData.totalRooms} rooms occupied currently.</p>
                  </div>
                </div>
              </div>

              {/* Status breakdown table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 border-b border-slate-100 pb-2">Room status aggregates</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 font-mono tracking-wide uppercase">Available</span>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">{reportData.totalRooms - reportData.occupied - reportData.reserved - reportData.cleaning - reportData.maintenance}</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-[10px] font-bold text-red-800 font-mono tracking-wide uppercase">Occupied</span>
                    <p className="text-2xl font-bold text-red-900 mt-1">{reportData.occupied}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-800 font-mono tracking-wide uppercase">Reserved</span>
                    <p className="text-2xl font-bold text-amber-900 mt-1">{reportData.reserved}</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-800 font-mono tracking-wide uppercase">Cleaning</span>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{reportData.cleaning}</p>
                  </div>
                  <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-800 font-mono tracking-wide uppercase">Maintenance</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reportData.maintenance}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
