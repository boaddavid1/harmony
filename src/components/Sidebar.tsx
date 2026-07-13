/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, CalendarRange, Key, LogOut, Users, 
  BedDouble, Tag, CreditCard, BarChart3, ShieldCheck, 
  Settings, UserSquare2, ShieldAlert, ClipboardCheck,
  ChevronLeft, ChevronRight, Hotel
} from 'lucide-react';
import { motion } from 'motion/react';
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

  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Receptionist', 'Accountant'] },
    { id: 'handover', name: 'Shift Handover', icon: ClipboardCheck, roles: ['Admin', 'Receptionist', 'Accountant'] },
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
    <motion.aside 
      className="bg-[#0f172a] text-[#94a3b8] flex flex-col h-screen shrink-0 border-r border-slate-800/60 overflow-hidden relative" 
      id="sidebar_container"
      animate={{ width: isCollapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 220, damping: 25 }}
    >
      {/* Hotel Title branding */}
      <div className={`p-4 border-b border-slate-800/40 flex items-center justify-between gap-2 bg-slate-950/20 ${isCollapsed ? 'flex-col py-6' : ''}`}>
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'flex-col text-center' : ''}`}>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 cursor-pointer"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Hotel className="h-4 w-4 text-blue-400 stroke-[2]" />
          </motion.div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col min-w-0"
            >
              <h1 className="text-xs font-extrabold font-sans uppercase tracking-wider text-white truncate max-w-[140px]">
                {hotelName || 'Grand Horizon'}
              </h1>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
                PMS System
              </p>
            </motion.div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ${isCollapsed ? 'mt-2' : ''}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className={`flex-1 overflow-y-auto py-6 space-y-1.5 no-scrollbar ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {allowedItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar_btn_${item.id}`}
              onClick={() => onViewChange(item.id)}
              className={`group relative w-full flex items-center rounded-lg text-[13px] font-medium transition-all text-left ${
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
              } ${
                isActive 
                  ? 'bg-[#3b82f6] text-white font-semibold' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isCollapsed ? (
                <motion.div 
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center shrink-0"
                >
                  <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                </motion.div>
              ) : (
                <>
                  <IconComponent className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.name}</span>
                </>
              )}

              {/* Collapsed Tooltip */}
              {isCollapsed && (
                <div className="absolute left-16 bg-slate-950 border border-slate-800 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap pointer-events-none z-50 font-sans tracking-wide">
                  {item.name}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Information Footer & Logout */}
      <div className={`p-4 border-t border-slate-800 bg-slate-950/60 flex flex-col gap-3 ${isCollapsed ? 'items-center px-2' : ''}`}>
        {isCollapsed ? (
          <div className="flex flex-col gap-3 items-center w-full">
            <div className="group relative">
              <div className="h-9 w-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-display text-sm cursor-pointer">
                {user.name.charAt(0)}
              </div>
              <div className="absolute left-16 bottom-0 bg-slate-950 border border-slate-800 text-white text-xs p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50">
                <span className="font-bold">{user.name}</span>
                <span className="block text-[10px] text-slate-400 uppercase font-mono mt-0.5">{user.role}</span>
              </div>
            </div>

            <button
              id="logout_btn"
              onClick={onLogout}
              className="group relative h-9 w-9 flex items-center justify-center bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-200 rounded-lg border border-slate-700/60 hover:border-red-800/50 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <div className="absolute left-16 bg-slate-950 border border-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap pointer-events-none z-50 font-sans tracking-wide">
                Logout Session
              </div>
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </motion.aside>
  );
}
