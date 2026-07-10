/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, CalendarRange, Key, LogOut, Users, 
  BedDouble, Tag, CreditCard, BarChart3, ShieldCheck, 
  Settings, UserSquare2, ShieldAlert
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  hotelName?: string;
}

export default function Sidebar({ currentView, onViewChange, user, onLogout, hotelName }: SidebarProps) {
  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Receptionist', 'Accountant'] },
    { id: 'reservations', name: 'Reservations', icon: CalendarRange, roles: ['Admin', 'Receptionist'] },
    { id: 'checkin', name: 'Check-In', icon: Key, roles: ['Admin', 'Receptionist'] },
    { id: 'checkout', name: 'Check-Out', icon: LogOut, roles: ['Admin', 'Receptionist'] },
    { id: 'guests', name: 'Guests', icon: Users, roles: ['Admin', 'Receptionist'] },
    { id: 'rooms', name: 'Rooms', icon: BedDouble, roles: ['Admin', 'Receptionist'] }, // Receptionist has read-only/view access
    { id: 'categories', name: 'Room Categories', icon: Tag, roles: ['Admin'] },
    { id: 'billing', name: 'Billing & Payments', icon: CreditCard, roles: ['Admin', 'Receptionist', 'Accountant'] },
    { id: 'reports', name: 'Reports', icon: BarChart3, roles: ['Admin', 'Accountant'] },
    { id: 'staff', name: 'Staff Management', icon: UserSquare2, roles: ['Admin'] },
    { id: 'audit', name: 'Audit Logs', icon: ShieldCheck, roles: ['Admin'] },
    { id: 'settings', name: 'System Settings', icon: Settings, roles: ['Admin'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className="w-[240px] bg-[#0f172a] text-[#94a3b8] flex flex-col h-screen shrink-0 border-r border-slate-800/60" id="sidebar_container">
      {/* Hotel Title branding */}
      <div className="p-6 border-b border-slate-800/40 flex items-center gap-3">
        <svg className="w-6 h-6 text-[#3b82f6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
        </svg>
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-bold font-sans uppercase tracking-wider text-white truncate">
            {hotelName || 'Grand Horizon'}
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            PMS System
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 no-scrollbar">
        {allowedItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar_btn_${item.id}`}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[13px] font-medium transition-all text-left ${
                isActive 
                  ? 'bg-[#3b82f6] text-white font-semibold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* User Information Footer & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-display text-sm">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-200 truncate">{user.name}</h4>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <button
          id="logout_btn"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-200 rounded-lg text-xs font-semibold border border-slate-700/60 hover:border-red-800/50 transition-all cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
