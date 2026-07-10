/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CalendarRange, Plus, Search, Calendar, Bed, CreditCard, 
  Trash2, X, RefreshCw, Check, ArrowRight, ClipboardList, ShieldAlert,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Reservation, Guest, Room, RoomCategory, BookingStatus, PaymentMethod } from '../types';
import { apiFetch } from '../api_client';

interface ReservationsViewProps {
  user: any;
  currency: string;
  initialStatusFilter?: string;
}

export default function ReservationsView({ user, currency, initialStatusFilter }: ReservationsViewProps) {
  const isReceptionistOrAdmin = user?.role === 'Admin' || user?.role === 'Receptionist';
  const canDelete = user?.role === 'Admin';

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'All');

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // --- Modals / Actions ---
  const [showBookModal, setShowBookModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);

  // --- Book Form fields ---
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);

  // --- Check-In Form fields ---
  const [activeResId, setActiveResId] = useState('');
  const [checkInDeposit, setCheckInDeposit] = useState('100');
  const [checkInPayMethod, setCheckInPayMethod] = useState<PaymentMethod>('Cash');

  // --- Check-Out Form fields ---
  const [checkOutExtra, setCheckOutExtra] = useState('0');
  const [checkOutDiscount, setCheckOutDiscount] = useState('0');
  const [calculatedGrandTotal, setCalculatedGrandTotal] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');

  // --- Calendar View States ---
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedResForDetails, setSelectedResForDetails] = useState<Reservation | null>(null);
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<Date | null>(null);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentCalendarDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleOpenBookingDetails = (res: Reservation) => {
    setSelectedResForDetails(res);
  };

  const getNextDay = (dateStr: string) => {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dObj = new Date(y, m, d + 1);
    
    const rY = dObj.getFullYear();
    const rM = String(dObj.getMonth() + 1).padStart(2, '0');
    const rD = String(dObj.getDate()).padStart(2, '0');
    return `${rY}-${rM}-${rD}`;
  };

  const getCalendarCells = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const totalCellsNeeded = cells.length <= 35 ? 35 : 42;
    const currentLength = cells.length;
    for (let i = 1; i <= (totalCellsNeeded - currentLength); i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return cells;
  };

  const getReservationsForDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${y}-${m}-${d}`;

    return (reservations || []).filter(r => {
      const matchesStatus = statusFilter === 'All' || r.bookingStatus === statusFilter;
      if (!matchesStatus) return false;

      const guest = guests.find(g => g.id === r.guestId);
      const guestName = guest ? (guest.fullName || '').toLowerCase() : '';
      const matchesSearch = searchQuery === '' || guestName.includes(searchQuery.toLowerCase()) || (r.id || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      return formattedDate >= r.checkInDate && formattedDate <= r.checkOutDate;
    });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resvData = await apiFetch('/api/reservations');
      const guestsData = await apiFetch('/api/guests');
      const roomsData = await apiFetch('/api/rooms');
      const catsData = await apiFetch('/api/categories');
      setReservations(resvData);
      setGuests(guestsData);
      setRooms(roomsData);
      setCategories(catsData);

      if (guestsData.length > 0) setSelectedGuestId(guestsData[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate pricing when dates or rooms change
  useEffect(() => {
    if (checkInDate && checkOutDate && selectedRooms.length > 0) {
      const start = new Date(checkInDate).getTime();
      const end = new Date(checkOutDate).getTime();
      const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      
      let cost = 0;
      selectedRooms.forEach(id => {
        const room = rooms.find(r => r.id === id);
        if (room) {
          cost += room.pricePerNight * nights;
        }
      });
      setTotalPrice(cost);
    } else {
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, selectedRooms, rooms]);

  const handleOpenBook = (prefilledCheckIn?: any) => {
    const checkIn = typeof prefilledCheckIn === 'string' ? prefilledCheckIn : '';
    setCheckInDate(checkIn);
    setCheckOutDate(checkIn ? getNextDay(checkIn) : '');
    setSelectedRooms([]);
    setTotalPrice(0);
    setDepositAmount(0);
    setErrorMessage('');
    if (guests.length > 0) setSelectedGuestId(guests[0].id);
    setShowBookModal(true);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedRooms.length === 0) {
      setErrorMessage('Please assign at least one room.');
      return;
    }

    const payload = {
      guestId: selectedGuestId,
      checkInDate,
      checkOutDate,
      rooms: selectedRooms,
      totalPrice,
      depositAmount,
      paidAmount: 0,
      bookingStatus: 'Confirmed' as BookingStatus
    };

    try {
      await apiFetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setShowBookModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error booking reservation.');
    }
  };

  // Check-In trigger
  const handleOpenCheckIn = (res: Reservation) => {
    setActiveResId(res.id);
    setCheckInDeposit('100');
    setCheckInPayMethod('Cash');
    setShowCheckInModal(true);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/reservations/${activeResId}/check-in`, {
        method: 'POST',
        body: JSON.stringify({
          depositAmount: parseFloat(checkInDeposit),
          paymentMethod: checkInPayMethod
        })
      });
      setShowCheckInModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  // Check-Out trigger
  const handleOpenCheckOut = (res: Reservation) => {
    setActiveResId(res.id);
    setCheckOutExtra('0');
    setCheckOutDiscount('0');
    setShowCheckOutModal(true);
  };

  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/reservations/${activeResId}/check-out`, {
        method: 'POST',
        body: JSON.stringify({
          extraCharges: parseFloat(checkOutExtra),
          discountAmount: parseFloat(checkOutDiscount)
        })
      });
      setShowCheckOutModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Check-out failed');
    }
  };

  // Cancel reservation
  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation booking? Associated rooms will be freed.')) return;
    try {
      await apiFetch(`/api/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ bookingStatus: 'Cancelled' })
      });
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel booking.');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('DANGER: This will delete the reservation record permanently. Proceed?')) return;
    try {
      await apiFetch(`/api/reservations/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Failed to delete booking.');
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter(id => id !== roomId));
    } else {
      setSelectedRooms([...selectedRooms, roomId]);
    }
  };

  const filteredReservations = reservations.filter(r => {
    const guest = guests.find(g => g.id === r.guestId);
    const guestName = guest ? guest.fullName.toLowerCase() : '';
    const matchesSearch = guestName.includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.bookingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Querying reservations desk ledger...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6 no-scrollbar" id="reservations_container">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <CalendarRange className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Reservations Desk</h2>
            <p className="text-xs text-slate-500 font-medium font-sans">Draft bookings, track stays, and initiate guest check-ins or check-outs dynamically.</p>
          </div>
        </div>

        {isReceptionistOrAdmin && (
          <button
            id="new_booking_btn"
            onClick={handleOpenBook}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Reservation</span>
          </button>
        )}
      </div>

      {/* Filters ledger */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="relative w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="res_search_input"
              type="text"
              placeholder="Search bookings by guest name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Booking Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-in">Checked-In</option>
            <option value="Checked-out">Checked-Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'calendar' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Bookings Table */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
                <th className="p-4">Reservation ID</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Assigned Rooms</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Financial Status</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 text-sm">
                    No active reservations registered in system matching query.
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => {
                  const guest = guests.find(g => g.id === res.guestId);
                  const assignedRooms = rooms.filter(rm => res.rooms.includes(rm.id));
                  const balance = res.totalPrice - res.paidAmount;

                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-mono font-bold text-slate-500">
                        #{res.id.split('_')[1] || res.id}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{guest ? guest.fullName : 'Unknown Guest'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{guest?.phone}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {assignedRooms.map(rm => (
                            <span key={rm.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium text-[10px] border border-blue-100">
                              Room {rm.roomNumber}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <span>{res.checkInDate}</span>
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                          <span>{res.checkOutDate}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">
                          Total: {currency}{res.totalPrice}
                        </p>
                        {balance > 0 ? (
                          <p className="text-[10px] text-red-500 font-medium">Due: {currency}{balance}</p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-semibold uppercase">Paid in Full</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          res.bookingStatus === 'Checked-in' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          res.bookingStatus === 'Checked-out' ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                          res.bookingStatus === 'Cancelled' ? 'bg-red-100 text-red-700 border border-red-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {res.bookingStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          {isReceptionistOrAdmin && res.bookingStatus === 'Confirmed' && (
                            <button
                              onClick={() => handleOpenCheckIn(res)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Check-In
                            </button>
                          )}
                          {isReceptionistOrAdmin && res.bookingStatus === 'Checked-in' && (
                            <button
                              onClick={() => handleOpenCheckOut(res)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Check-Out
                            </button>
                          )}
                          {isReceptionistOrAdmin && (res.bookingStatus === 'Pending' || res.bookingStatus === 'Confirmed') && (
                            <button
                              onClick={() => handleCancelBooking(res.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded text-[10px] font-bold border border-slate-200 hover:border-rose-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteBooking(res.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete booking"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 flex flex-col gap-6" id="calendar_view_container">
          {/* Calendar Navigation header */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800 font-display">
                {currentCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">
                Month-At-A-Glance
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200/60">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white hover:shadow-xs rounded-md text-slate-600 cursor-pointer transition-all"
                title="Previous Month"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 bg-white shadow-xs rounded-md text-xs font-semibold text-slate-700 cursor-pointer transition-all hover:bg-slate-50"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white hover:shadow-xs rounded-md text-slate-600 cursor-pointer transition-all"
                title="Next Month"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Days of Week */}
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="text-center py-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                {day.slice(0, 3)}
              </div>
            ))}

            {/* Calendar Cells */}
            {(() => {
              const cells = getCalendarCells();
              const todayObj = new Date();
              return cells.map(({ date, isCurrentMonth }, idx) => {
                const cellReservations = getReservationsForDate(date);
                const isCellToday = todayObj.getFullYear() === date.getFullYear() && todayObj.getMonth() === date.getMonth() && todayObj.getDate() === date.getDate();
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (cellReservations.length > 0) {
                        setSelectedDateForDetails(date);
                      } else if (isReceptionistOrAdmin && isCurrentMonth) {
                        handleOpenBook(dateStr);
                      }
                    }}
                    className={`min-h-[110px] p-2 rounded-xl border transition-all flex flex-col gap-1.5 group/cell relative overflow-hidden cursor-pointer ${
                      isCurrentMonth 
                        ? 'bg-white border-slate-100 hover:border-blue-200 hover:shadow-xs' 
                        : 'bg-slate-50/40 border-slate-100/40 text-slate-400'
                    } ${isCellToday ? 'ring-2 ring-blue-500/10 border-blue-200 bg-blue-50/10' : ''}`}
                  >
                    {/* Date Header */}
                    <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                      {isReceptionistOrAdmin && isCurrentMonth && (
                        <button
                          onClick={() => handleOpenBook(dateStr)}
                          className="opacity-0 group-hover/cell:opacity-100 p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-all cursor-pointer"
                          title="Register Reservation on Date"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                      <span className={`text-xs font-bold ${
                        isCellToday 
                          ? 'h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-display shadow-xs ml-auto' 
                          : isCurrentMonth ? 'text-slate-700 ml-auto' : 'text-slate-400 ml-auto'
                      }`}>
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Reservations list in cell */}
                    <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1 max-h-[75px]" onClick={(e) => e.stopPropagation()}>
                      {cellReservations.slice(0, 3).map((res) => {
                        const guest = guests.find(g => g.id === res.guestId);
                        const assignedRooms = rooms.filter(rm => res.rooms.includes(rm.id));
                        const roomLabel = assignedRooms.map(r => r.roomNumber).join(', ');
                        
                        const statusColors: Record<BookingStatus, string> = {
                          'Pending': 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50',
                          'Confirmed': 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50',
                          'Checked-in': 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50',
                          'Checked-out': 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/50',
                          'Cancelled': 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100/50'
                        };

                        return (
                          <button
                            key={res.id}
                            onClick={() => handleOpenBookingDetails(res)}
                            className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-semibold border truncate cursor-pointer transition-all ${
                              statusColors[res.bookingStatus] || 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                            title={`${guest?.fullName || 'Guest'}: Room ${roomLabel}`}
                          >
                            <span className="font-bold">{roomLabel ? `Rm ${roomLabel}` : 'No Rm'}:</span> {guest ? guest.fullName.split(' ')[0] : 'Guest'}
                          </button>
                        );
                      })}
                      
                      {cellReservations.length > 3 && (
                        <button
                          onClick={() => setSelectedDateForDetails(date)}
                          className="text-[9px] font-bold text-blue-600 hover:text-blue-500 hover:underline text-center py-0.5 cursor-pointer"
                        >
                          + {cellReservations.length - 3} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Create Reservation Booking</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleBookSubmit} className="flex flex-col gap-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Select Registered Guest</label>
                <select
                  value={selectedGuestId}
                  onChange={(e) => setSelectedGuestId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {guests.map(g => (
                    <option key={g.id} value={g.id}>{g.fullName} ({g.phone})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Assign Rooms selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Assign Rooms (Pick multiple if needed)</label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 bg-slate-50 no-scrollbar">
                  {rooms.filter(r => r.status === 'Available').length === 0 ? (
                    <p className="text-slate-400 text-center py-4">No rooms are currently marked as Available.</p>
                  ) : (
                    rooms.filter(r => r.status === 'Available').map(rm => (
                      <label key={rm.id} className="flex items-center gap-2.5 p-2 bg-white rounded border border-slate-100 hover:border-blue-100 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={selectedRooms.includes(rm.id)}
                          onChange={() => toggleRoomSelection(rm.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <div className="flex justify-between items-baseline flex-1">
                          <span className="font-semibold text-slate-800">Room {rm.roomNumber}</span>
                          <span className="text-slate-500 text-[10px]">({categories.find(c => c.id === rm.categoryId)?.name})</span>
                          <span className="font-bold text-blue-600 font-display">{currency}{rm.pricePerNight}/night</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Price Calculation overlay */}
              {totalPrice > 0 && (
                <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex flex-col gap-1 text-blue-900">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold uppercase font-mono tracking-wider text-[9px] text-blue-500">Calculated Lodging Cost:</span>
                    <span className="text-base font-bold font-display">{currency}{totalPrice}</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-medium">Automatic system calculation based on nightly rates across stay duration.</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                Register Reservation Booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Initiate Check-In</h3>
              <button onClick={() => setShowCheckInModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="flex flex-col gap-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Assigning room key and generating stay invoice. Record any check-in security deposit below.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Security Deposit Amount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={checkInDeposit}
                  onChange={(e) => setCheckInDeposit(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Payment Method</label>
                <select
                  value={checkInPayMethod}
                  onChange={(e) => setCheckInPayMethod(e.target.value as PaymentMethod)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                Confirm Stay Check-In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Initiate Check-Out</h3>
              <button onClick={() => setShowCheckOutModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCheckOutSubmit} className="flex flex-col gap-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Fulfilling stays. Add extra services (room service, incidental minibar charges) or customer loyalty discounts here.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Extra / Incidental Charges ({currency})</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={checkOutExtra}
                  onChange={(e) => setCheckOutExtra(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Loyalty / Campaign Discount ({currency})</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={checkOutDiscount}
                  onChange={(e) => setCheckOutDiscount(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                Perform Check-Out & Finalize Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedResForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                  selectedResForDetails.bookingStatus === 'Checked-in' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  selectedResForDetails.bookingStatus === 'Checked-out' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                  selectedResForDetails.bookingStatus === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {selectedResForDetails.bookingStatus}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  #{selectedResForDetails.id.split('_')[1] || selectedResForDetails.id}
                </span>
              </div>
              <button 
                onClick={() => setSelectedResForDetails(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const guest = guests.find(g => g.id === selectedResForDetails.guestId);
              const assignedRooms = rooms.filter(rm => selectedResForDetails.rooms.includes(rm.id));
              const balance = selectedResForDetails.totalPrice - selectedResForDetails.paidAmount;

              return (
                <div className="flex flex-col gap-4 text-xs">
                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 flex flex-col gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Registered Guest</span>
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-slate-800">{guest ? guest.fullName : 'Unknown Guest'}</span>
                      <span className="text-slate-500 mt-0.5">{guest?.email || 'No email registered'}</span>
                      <span className="text-slate-500">{guest?.phone || 'No phone registered'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Check-In</span>
                      <span className="font-bold text-slate-700">{selectedResForDetails.checkInDate}</span>
                    </div>
                    <div className="border border-slate-100 p-3 rounded-xl flex flex-col gap-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Check-Out</span>
                      <span className="font-bold text-slate-700">{selectedResForDetails.checkOutDate}</span>
                    </div>
                  </div>

                  <div className="border border-slate-100 p-3 rounded-xl flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Assigned Lodging</span>
                    <div className="flex flex-wrap gap-1.5">
                      {assignedRooms.map(rm => (
                        <span key={rm.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium text-[10px] border border-blue-100">
                          Room {rm.roomNumber} ({categories.find(c => c.id === rm.categoryId)?.name || 'Standard'})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-150 flex flex-col gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Invoice Ledger</span>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between font-medium text-slate-600">
                        <span>Grand Total:</span>
                        <span className="font-bold text-slate-800">{currency}{selectedResForDetails.totalPrice}</span>
                      </div>
                      <div className="flex justify-between font-medium text-slate-600">
                        <span>Paid Amount:</span>
                        <span className="font-bold text-emerald-600">{currency}{selectedResForDetails.paidAmount}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-1" />
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Outstanding Balance:</span>
                        <span className={balance > 0 ? 'text-red-500' : 'text-emerald-600'}>
                          {currency}{balance}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Drawer */}
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                    {isReceptionistOrAdmin && selectedResForDetails.bookingStatus === 'Confirmed' && (
                      <button
                        onClick={() => {
                          setSelectedResForDetails(null);
                          handleOpenCheckIn(selectedResForDetails);
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
                      >
                        Check-In Guest
                      </button>
                    )}
                    {isReceptionistOrAdmin && selectedResForDetails.bookingStatus === 'Checked-in' && (
                      <button
                        onClick={() => {
                          setSelectedResForDetails(null);
                          handleOpenCheckOut(selectedResForDetails);
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all"
                      >
                        Check-Out Guest
                      </button>
                    )}
                    {isReceptionistOrAdmin && (selectedResForDetails.bookingStatus === 'Pending' || selectedResForDetails.bookingStatus === 'Confirmed') && (
                      <button
                        onClick={async () => {
                          const res = selectedResForDetails;
                          setSelectedResForDetails(null);
                          await handleCancelBooking(res.id);
                        }}
                        className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold cursor-pointer transition-all"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Date Detail Occupancy Modal */}
      {selectedDateForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">
                  Bookings on {selectedDateForDetails.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Summary of occupancy and reservations on this date.</p>
              </div>
              <button 
                onClick={() => setSelectedDateForDetails(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto no-scrollbar">
              {(() => {
                const dayReservations = getReservationsForDate(selectedDateForDetails);
                if (dayReservations.length === 0) {
                  return <p className="text-slate-400 text-center py-6 text-xs">No active bookings for this date.</p>;
                }

                return dayReservations.map(res => {
                  const guest = guests.find(g => g.id === res.guestId);
                  const assignedRooms = rooms.filter(rm => res.rooms.includes(rm.id));
                  const roomLabel = assignedRooms.map(r => r.roomNumber).join(', ');

                  return (
                    <div 
                      key={res.id} 
                      onClick={() => {
                        setSelectedDateForDetails(null);
                        handleOpenBookingDetails(res);
                      }}
                      className="p-3 bg-slate-50 hover:bg-blue-50/30 border border-slate-150 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-xs text-slate-800">{guest ? guest.fullName : 'Unknown Guest'}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Rooms: {roomLabel || 'None assigned'}</span>
                        <span className="text-[9px] text-slate-400 font-mono">Stay: {res.checkInDate} to {res.checkOutDate}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        res.bookingStatus === 'Checked-in' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                        res.bookingStatus === 'Checked-out' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                        res.bookingStatus === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                        'bg-amber-50 text-amber-700 border border-amber-150'
                      }`}>
                        {res.bookingStatus}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
