/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bed, BedDouble, CalendarCheck, Coins, Percent, CheckSquare, 
  UserPlus, ArrowUpRight, TrendingUp, RefreshCw, ShoppingCart, LayoutDashboard
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { apiFetch } from '../api_client';
import { User } from '../types';
import AddExpenseModal from './AddExpenseModal';
import POSTerminal from './POSTerminal';

interface DashboardViewProps {
  user: User | null;
  onNavigateToView: (view: string) => void;
  currency: string;
}

export default function DashboardView({ user, onNavigateToView, currency }: DashboardViewProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentReservations, setRecentReservations] = useState<any[]>([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'analytics' | 'pos'>('analytics');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const statsData = await apiFetch('/api/dashboard/stats');
      setStats(statsData);

      const resvData = await apiFetch('/api/reservations');
      const guestsData = await apiFetch('/api/guests');
      const expensesData = await apiFetch('/api/expenses').catch(() => []);
      
      setExpenses(expensesData || []);

      // Combine reservation with guest name for display
      const list = resvData.map((r: any) => {
        const guest = guestsData.find((g: any) => g.id === r.guestId);
        return {
          ...r,
          guestName: guest ? guest.fullName : 'Unknown Guest'
        };
      });
      // Sort by newest first
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentReservations(list.slice(0, 5));
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-10">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Compiling analytics engine...</p>
      </div>
    );
  }

  const cards = stats.cards;
  const charts = stats.charts;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

  const occupancyPieData = [
    { name: 'Occupied', value: cards.occupiedRooms },
    { name: 'Available', value: cards.availableRooms },
    { name: 'Reserved', value: cards.reservedRooms },
    { name: 'Cleaning', value: cards.cleaningRooms },
    { name: 'Maintenance', value: cards.maintenanceRooms }
  ].filter(item => item.value > 0);

  // Process expense data for the Pie Chart
  const getExpensePieData = () => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(e => {
      const cat = e.category || 'Others';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
    });
    
    // Sort by descending value to make the pie chart sections clear
    const sortedCategories = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return sortedCategories;
  };

  const expensePieData = getExpensePieData();
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 no-scrollbar">
      
      {/* Welcome header banner */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold font-display tracking-tight text-slate-900">
            Welcome back, {user?.name}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Here's the performance and occupancy health of your resort today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-red-500/10 transition-all cursor-pointer"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="flex bg-slate-100 p-1 rounded-xl self-start max-w-sm border border-slate-200/50">
        <button
          onClick={() => setDashboardTab('analytics')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            dashboardTab === 'analytics'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>PMS Analytics</span>
        </button>
        <button
          onClick={() => setDashboardTab('pos')}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            dashboardTab === 'pos'
              ? 'bg-white text-slate-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Front Desk POS</span>
        </button>
      </div>

      {dashboardTab === 'pos' ? (
        <POSTerminal user={user} currency={currency} onSuccess={fetchDashboardData} />
      ) : (
        <>
          {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Rooms & Occupancy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Occupancy Rate</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{cards.occupancyRate}%</h3>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-semibold text-blue-600">{cards.occupiedRooms}</span> / {cards.totalRooms} occupied
          </p>
        </div>

        {/* Daily Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Revenue Today</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{currency}{cards.todayRevenue.toLocaleString()}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Month: <span className="font-semibold text-emerald-600">{currency}{cards.monthlyRevenue.toLocaleString()}</span>
          </p>
        </div>

        {/* Today's Checkins */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Today's Check-ins</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{cards.todayCheckIns}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-2 cursor-pointer hover:underline text-blue-600 font-medium" onClick={() => onNavigateToView('checkin')}>
            Check-in list &rarr;
          </p>
        </div>

        {/* Active Reservations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Today's Check-outs</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{cards.todayCheckOuts}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-2 cursor-pointer hover:underline text-purple-600 font-medium" onClick={() => onNavigateToView('checkout')}>
            Check-out list &rarr;
          </p>
        </div>

      </div>

      {/* Charts section: Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">Monthly Revenue Flow ({currency})</h3>
            <span className="text-xs font-semibold text-slate-400 font-mono">LAST 6 MONTHS</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Status Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">Room Status Allocations</h3>
          <div className="h-[220px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {occupancyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {occupancyPieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-slate-600 truncate">{item.name}: <strong className="text-slate-800 font-semibold">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Booking Trends Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">Reservation Velocity</h3>
            <span className="text-xs font-semibold text-slate-400 font-mono">LAST 7 DAYS</span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.bookingTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Bookings List Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">Recent Bookings</h3>
            <button 
              onClick={() => onNavigateToView('reservations')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              View all
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
            {recentReservations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs py-10">
                No bookings registered yet.
              </div>
            ) : (
              recentReservations.map((res: any) => (
                <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 transition-all hover:bg-slate-100/50">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{res.guestName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      {res.checkInDate} to {res.checkOutDate}
                    </p>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    res.bookingStatus === 'Checked-in' ? 'bg-blue-100 text-blue-700' :
                    res.bookingStatus === 'Checked-out' ? 'bg-slate-200 text-slate-700' :
                    res.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {res.bookingStatus}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Row 4: Expense Distribution Pie Chart & Recent Expenses List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expense Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">Expense Distribution</h3>
            <button
              onClick={() => onNavigateToView('billing')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Manage
            </button>
          </div>
          
          {expenses.length === 0 ? (
            <div className="flex-1 h-[220px] flex items-center justify-center text-slate-400 text-xs py-10">
              No operational expenses recorded.
            </div>
          ) : (
            <>
              <div className="h-[220px] relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [`${currency}${value.toLocaleString()}`, 'Outflow']}
                      contentStyle={{ fontSize: '11px', borderRadius: '6px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Total Spent</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-0.5 tracking-tight">{currency}{totalExpenseAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 pt-3">
                {expensePieData.slice(0, 6).map((item, index) => {
                  const percentage = totalExpenseAmount > 0 ? Math.round((item.value / totalExpenseAmount) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length] }} />
                      <span className="text-slate-600 truncate" title={`${item.name}: ${percentage}%`}>
                        {item.name}: <strong className="text-slate-800 font-semibold">{percentage}%</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Recent Operational Expenses list */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold font-display text-slate-800 uppercase tracking-wide">Recent Operational Expenses</h3>
            <button 
              onClick={() => onNavigateToView('billing')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              View Journal
            </button>
          </div>
          <div className="flex-1 overflow-x-auto">
            {expenses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs py-10">
                No operational expenses registered yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase font-mono tracking-wider text-[10px]">
                    <th className="pb-3 pr-2">Date</th>
                    <th className="pb-3 pr-2">Description</th>
                    <th className="pb-3 pr-2">Category</th>
                    <th className="pb-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {[...expenses].reverse().slice(0, 5).map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50/30">
                      <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{exp.date}</td>
                      <td className="py-2.5 font-semibold text-slate-700 max-w-[180px] truncate" title={exp.description}>
                        {exp.description}
                      </td>
                      <td className="py-2.5">
                        <span className="bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-red-600 font-mono">
                        {currency}{exp.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

        </>
      )}

      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={() => setShowAddExpenseModal(false)}
        onSuccess={fetchDashboardData}
        currency={currency}
      />

    </div>
  );
}
