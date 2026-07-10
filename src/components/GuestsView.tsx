/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, History, ChevronRight, 
  MapPin, ShieldAlert, Phone, Mail, UserCheck, X, RefreshCw, Calendar, CreditCard
} from 'lucide-react';
import { Guest, User } from '../types';
import { apiFetch } from '../api_client';

interface GuestsViewProps {
  user: User | null;
  currency: string;
}

export default function GuestsView({ user, currency }: GuestsViewProps) {
  const isReceptionistOrAdmin = user?.role === 'Admin' || user?.role === 'Receptionist';
  const canDelete = user?.role === 'Admin';

  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected guest for History Details drawer
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestHistory, setGuestHistory] = useState<{
    reservations: any[];
    invoices: any[];
    payments: any[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form Modals states
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  
  // Emergency Contact Sub-fields
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const fetchGuests = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/guests');
      setGuests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleOpenAdd = () => {
    setEditingGuest(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setNationality('');
    setIdType('Passport');
    setIdNumber('');
    setAddress('');
    setEmergencyName('');
    setEmergencyPhone('');
    setEmergencyRelationship('');
    setErrorMessage('');
    setShowModal(true);
  };

  const handleOpenEdit = (guest: Guest, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering History side panel
    setEditingGuest(guest);
    setFullName(guest.fullName || '');
    setPhone(guest.phone || '');
    setEmail(guest.email || '');
    setNationality(guest.nationality || '');
    setIdType(guest.idType || 'Passport');
    setIdNumber(guest.idNumber || '');
    setAddress(guest.address || '');
    setEmergencyName(guest.emergencyContact?.name || '');
    setEmergencyPhone(guest.emergencyContact?.phone || '');
    setEmergencyRelationship(guest.emergencyContact?.relationship || '');
    setErrorMessage('');
    setShowModal(true);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const payload = {
      fullName,
      phone,
      email,
      nationality,
      idType,
      idNumber,
      address,
      emergencyContact: {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: emergencyRelationship
      }
    };

    try {
      if (editingGuest) {
        await apiFetch(`/api/guests/${editingGuest.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/guests', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchGuests();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving guest.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening history drawer
    if (!window.confirm('Are you sure you want to permanently delete this guest profile?')) return;
    try {
      await apiFetch(`/api/guests/${id}`, { method: 'DELETE' });
      if (selectedGuest?.id === id) {
        setSelectedGuest(null);
        setGuestHistory(null);
      }
      fetchGuests();
    } catch (err: any) {
      alert(err.message || 'Error deleting guest.');
    }
  };

  // Open History slide panel
  const handleSelectGuest = async (guest: Guest) => {
    setSelectedGuest(guest);
    setHistoryLoading(true);
    try {
      const data = await apiFetch(`/api/guests/${guest.id}/history`);
      setGuestHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredGuests = guests.filter(g => {
    const q = searchQuery.toLowerCase();
    return (
      g.fullName.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      g.nationality.toLowerCase().includes(q) ||
      g.idNumber.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Querying registered guests directory...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col font-sans relative" id="guests_view_container">
      
      {/* Upper Panel */}
      <div className="p-6 border-b border-slate-200 bg-white flex flex-col gap-5 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-5.5 w-5.5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Guest Directory</h2>
              <p className="text-xs text-slate-500 font-medium">Register and view guest profiles, emergency contacts, and historic stays.</p>
            </div>
          </div>
          
          {isReceptionistOrAdmin && (
            <button
              id="add_guest_btn"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Register Guest</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="guest_search_input"
            type="text"
            placeholder="Search guests by name, phone, email, or passport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main split dashboard (Guests table and slide-out History details) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Table layout list */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Contact Info</th>
                  <th className="p-4">Nationality</th>
                  <th className="p-4">Identification</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                      No guests registered in system matching query.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map(g => (
                    <tr 
                      key={g.id}
                      onClick={() => handleSelectGuest(g)}
                      className={`hover:bg-slate-50/70 transition-all cursor-pointer ${selectedGuest?.id === g.id ? 'bg-blue-50/40' : ''}`}
                    >
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{g.fullName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">ID: {g.id}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-slate-700 font-medium">{g.phone}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{g.email}</p>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{g.nationality}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">
                          {g.idType}: {g.idNumber}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                          {isReceptionistOrAdmin && (
                            <button
                              onClick={(e) => handleOpenEdit(g, e)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 cursor-pointer"
                              title="Edit guest profile"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={(e) => handleDelete(g.id, e)}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer"
                              title="Delete guest profile"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => handleSelectGuest(g)}
                            className="p-1.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-lg border border-slate-200 cursor-pointer"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right slideout History Panel */}
        {selectedGuest && (
          <div className="w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-in">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Guest Stay History</h3>
              </div>
              <button 
                onClick={() => setSelectedGuest(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar text-xs">
              
              {/* Guest Summary Card */}
              <div className="flex flex-col gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedGuest.fullName}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Registered Since: {new Date(selectedGuest.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedGuest.address || 'No address logged'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{selectedGuest.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{selectedGuest.email}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {selectedGuest.emergencyContact && selectedGuest.emergencyContact.name && (
                <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                  <h5 className="font-bold text-amber-800 flex items-center gap-1.5 uppercase font-mono text-[9px] tracking-wider mb-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                    <span>Emergency Contact</span>
                  </h5>
                  <p className="font-semibold text-slate-800">{selectedGuest.emergencyContact.name}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Relationship: {selectedGuest.emergencyContact.relationship}</p>
                  <p className="text-[11px] text-slate-600 font-mono mt-1">{selectedGuest.emergencyContact.phone}</p>
                </div>
              )}

              {/* History booking records */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h5 className="font-bold text-slate-500 uppercase font-mono text-[9px] tracking-wider">Stay & Reservations Log</h5>
                
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                    <span className="text-[11px] text-slate-400">Fetching invoice logs...</span>
                  </div>
                ) : !guestHistory || !guestHistory.reservations || guestHistory.reservations.length === 0 ? (
                  <div className="text-slate-400 text-center py-6">
                    No bookings found in historic records.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guestHistory.reservations.map((res: any) => (
                      <div key={res.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">Res ID: {res.id.split('_')[1] || res.id}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            res.bookingStatus === 'Checked-in' ? 'bg-blue-100 text-blue-700' :
                            res.bookingStatus === 'Checked-out' ? 'bg-emerald-100 text-emerald-700' :
                            res.bookingStatus === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {res.bookingStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>In: {res.checkInDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Out: {res.checkOutDate}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-slate-100 pt-2 mt-1">
                          <span className="text-[10px] text-slate-400">Total Charged:</span>
                          <span className="font-bold text-blue-600">{currency}{res.totalPrice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Guest Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">
                {editingGuest ? 'Edit Guest Profile' : 'Register Guest Profile'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleGuestSubmit} className="flex flex-col gap-5 text-xs">
              
              {/* Profile Details */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[10px] font-mono uppercase tracking-wider text-blue-600 border-b border-blue-50 pb-1.5">Personal Identity Information</h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alice Smith"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0201"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alice@example.com"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Nationality</label>
                    <input
                      type="text"
                      required
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      placeholder="e.g. USA"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">ID Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Passport">Passport</option>
                      <option value="National ID">National ID</option>
                      <option value="Driver's License">Driver's License</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">ID Number</label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="US87654321"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Physical Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Pine St, New York, NY"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-[10px] font-mono uppercase tracking-wider text-amber-600 border-b border-amber-50 pb-1.5">Emergency Contact Details</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5 col-span-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="Bob Smith"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Relationship</label>
                    <input
                      type="text"
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      placeholder="Spouse, Mother..."
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Contact Phone</label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+1 555-0202"
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                {editingGuest ? 'Update Guest Profile' : 'Register Guest Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
