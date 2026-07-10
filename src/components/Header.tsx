/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Clock, CheckCircle2, AlertTriangle, 
  X, ExternalLink, Calendar, HelpCircle, ChevronDown
} from 'lucide-react';
import { Notification, User } from '../types';
import { apiFetch } from '../api_client';

interface HeaderProps {
  user: User | null;
  onSearchResultClick: (type: string, id: string) => void;
  currency: string;
}

export default function Header({ user, onSearchResultClick, currency }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    guests: any[];
    rooms: any[];
    reservations: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Update digital clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Global search handler
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        try {
          const data = await apiFetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(data);
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const markOneRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  return (
    <header className="h-[72px] bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 relative z-40" id="app_header">
      
      {/* Global Search Bar */}
      <div className="w-80 relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="global_search_input"
            type="text"
            placeholder="Search reservations, guests, or rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-slate-100 border-none rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto z-50">
            {/* Guests segment */}
            {(searchResults.guests || []).length > 0 && (
              <div className="p-2 border-b border-slate-100">
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 px-3 py-1 block">Guests</span>
                {(searchResults.guests || []).map((g: any) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      onSearchResultClick('guests', g.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between text-sm transition-all"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{g.fullName}</p>
                      <p className="text-xs text-slate-400">{g.phone} &bull; {g.email}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
            )}

            {/* Rooms segment */}
            {(searchResults.rooms || []).length > 0 && (
              <div className="p-2 border-b border-slate-100">
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 px-3 py-1 block">Rooms</span>
                {(searchResults.rooms || []).map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSearchResultClick('rooms', r.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between text-sm transition-all"
                  >
                    <div>
                      <p className="font-medium text-slate-800">Room {r.roomNumber}</p>
                      <p className="text-xs text-slate-400">Floor {r.floor} &bull; {currency}{r.pricePerNight}/night</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      r.status === 'Available' ? 'bg-emerald-50 text-emerald-600' :
                      r.status === 'Occupied' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {r.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Reservations segment */}
            {(searchResults.reservations || []).length > 0 && (
              <div className="p-2">
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 px-3 py-1 block">Reservations</span>
                {(searchResults.reservations || []).map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onSearchResultClick('reservations', r.id);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between text-sm transition-all"
                  >
                    <div>
                      <p className="font-medium text-slate-800">Reservation {r.id.split('_')[1] || r.id}</p>
                      <p className="text-xs text-slate-400">Status: {r.bookingStatus} &bull; {r.checkInDate} to {r.checkOutDate}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
            )}

            {(searchResults.guests || []).length === 0 && (searchResults.rooms || []).length === 0 && (searchResults.reservations || []).length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                No matching records found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side - Digital Clock, Notifications, User Badge */}
      <div className="flex items-center gap-6">
        
        {/* Real-time UTC/Local Clock */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 font-mono">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-slate-300">|</span>
          <span>
            {currentTime.toLocaleTimeString()}
          </span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            id="notification_bell_btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-all relative"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications List */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden w-80 z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <span className="text-xs font-bold font-display text-slate-800">System Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 no-scrollbar">
                {(notifications || []).length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active notifications.
                  </div>
                ) : (
                  (notifications || []).map((n) => (
                    <div 
                      key={n.id}
                      className={`p-3.5 text-xs transition-all flex items-start gap-3 ${n.isRead ? 'opacity-60 bg-white' : 'bg-blue-50/20 font-medium'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                         n.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                         n.type === 'error' ? <AlertTriangle className="h-4 w-4 text-rose-500" /> :
                         <Bell className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-700 leading-normal">{n.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={(e) => markOneRead(n.id, e)}
                          className="text-slate-300 hover:text-slate-500 p-0.5"
                          title="Mark as read"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Minimalist Profile Badge */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">{user?.role}</p>
          </div>
        </div>

      </div>
    </header>
  );
}
