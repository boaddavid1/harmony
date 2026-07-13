/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import RoomsView from './components/RoomsView';
import ReservationsView from './components/ReservationsView';
import GuestsView from './components/GuestsView';
import BillingView from './components/BillingView';
import ReportsView from './components/ReportsView';
import StaffView from './components/StaffView';
import AuditView from './components/AuditView';
import SettingsView from './components/SettingsView';
import ShiftHandoverView from './components/ShiftHandoverView';
import { User } from './types';
import { apiFetch, authApi } from './api_client';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [currency, setCurrency] = useState('$');
  const [hotelName, setHotelName] = useState('Grand Horizon Resort');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (hotelName) {
      document.title = `${hotelName} - PMS Portal`;
    } else {
      document.title = 'Grand Horizon Resort & Spa - PMS Portal';
    }
  }, [hotelName]);

  const fetchSession = async () => {
    try {
      const data = await apiFetch('/api/auth/session');
      setUser(data.user);
      // Wait to fetch config until after we are verified
      await fetchConfig();
    } catch (e) {
      setUser(null);
    }
  };

  const fetchConfig = async () => {
    try {
      const data = await apiFetch('/api/settings');
      setCurrency(data.currencySymbol || '$');
      setHotelName(data.hotelName || 'Grand Horizon Resort');
    } catch (e) {
      console.error('Failed to fetch config:', e);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentView('dashboard');
    fetchConfig();
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    authApi.logout();
    setUser(null);
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const handleSearchResultClick = (type: string, id: string) => {
    if (type === 'room') {
      setCurrentView('rooms');
    } else if (type === 'guest') {
      setCurrentView('guests');
    } else if (type === 'reservation') {
      setCurrentView('reservations');
    }
  };

  // Helper to render current screen
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView user={user} currency={currency} onNavigateToView={setCurrentView} />;
      case 'handover':
        return <ShiftHandoverView user={user} currency={currency} />;
      case 'rooms':
        return <RoomsView user={user} currency={currency} />;
      case 'categories':
        return <RoomsView user={user} currency={currency} initialTab="categories" />;
      case 'reservations':
        return <ReservationsView user={user} currency={currency} />;
      case 'checkin':
        return <ReservationsView user={user} currency={currency} initialStatusFilter="Confirmed" />;
      case 'checkout':
        return <ReservationsView user={user} currency={currency} initialStatusFilter="Checked-in" />;
      case 'guests':
        return <GuestsView user={user} currency={currency} />;
      case 'billing':
        return <BillingView user={user} currency={currency} />;
      case 'reports':
        return <ReportsView user={user} currency={currency} />;
      case 'staff':
        return <StaffView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView onSettingsUpdate={fetchConfig} />;
      default:
        return <DashboardView user={user} currency={currency} onNavigateToView={setCurrentView} />;
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      
      {/* Dynamic Navigation Sidebar */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        user={user} 
        onLogout={handleLogout}
        hotelName={hotelName}
      />

      {/* Primary Workspace viewport wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Workspace global Header bar */}
        <Header 
          user={user} 
          onSearchResultClick={handleSearchResultClick} 
          currency={currency}
        />

        {/* Content body stage */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden" id="workspace_content_stage">
          {renderView()}
        </main>

      </div>

    </div>
  );
}
