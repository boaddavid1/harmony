/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BedDouble, Plus, Edit2, Trash2, Tag, Layers, Check, 
  Settings, AlertTriangle, ShieldAlert, Image, Filter, RefreshCw, UploadCloud
} from 'lucide-react';
import { Room, RoomCategory, RoomStatus, User } from '../types';
import { apiFetch } from '../api_client';

interface RoomsViewProps {
  user: User | null;
  currency: string;
  initialTab?: 'rooms' | 'categories';
}

export default function RoomsView({ user, currency, initialTab }: RoomsViewProps) {
  const isAdmin = user?.role === 'Admin';
  
  const [activeTab, setActiveTab] = useState<'rooms' | 'categories'>(initialTab || 'rooms');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // States for Rooms
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modals / Form states
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomCatId, setRoomCatId] = useState('');
  const [roomFloor, setRoomFloor] = useState('1');
  const [roomCapacity, setRoomCapacity] = useState('2');
  const [roomPrice, setRoomPrice] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('Available');
  const [roomImage, setRoomImage] = useState('');

  // Categories Modal / Form states
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<RoomCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catPrice, setCatPrice] = useState('');
  const [catAmenities, setCatAmenities] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP, etc.)');
      return;
    }
    // Limit to 5MB to be safe with base64
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRoomImage(event.target.result as string);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const roomData = await apiFetch('/api/rooms');
      const catData = await apiFetch('/api/categories');
      setRooms(roomData);
      setCategories(catData);
      if (catData.length > 0) {
        setRoomCatId(catData[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomNumber('');
    if (categories.length > 0) setRoomCatId(categories[0].id);
    setRoomFloor('1');
    setRoomCapacity('2');
    setRoomPrice('');
    setRoomStatus('Available');
    setRoomImage('');
    setErrorMessage('');
    setShowRoomModal(true);
  };

  const openEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber || '');
    setRoomCatId(room.categoryId || '');
    setRoomFloor((room.floor !== undefined && room.floor !== null ? room.floor : 0).toString());
    setRoomCapacity((room.capacity !== undefined && room.capacity !== null ? room.capacity : 0).toString());
    setRoomPrice((room.pricePerNight !== undefined && room.pricePerNight !== null ? room.pricePerNight : 0).toString());
    setRoomStatus(room.status || 'Available');
    setRoomImage(room.imageUrl || '');
    setErrorMessage('');
    setShowRoomModal(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const payload = {
      roomNumber,
      categoryId: roomCatId,
      floor: parseInt(roomFloor),
      capacity: parseInt(roomCapacity),
      pricePerNight: parseFloat(roomPrice),
      status: roomStatus,
      imageUrl: roomImage || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600'
    };

    if (isNaN(payload.pricePerNight) || payload.pricePerNight <= 0) {
      setErrorMessage('Please enter a valid room price.');
      return;
    }

    try {
      if (editingRoom) {
        await apiFetch(`/api/rooms/${editingRoom.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/rooms', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowRoomModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving room.');
    }
  };

  const deleteRoom = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this room? This action cannot be undone.')) return;
    try {
      await apiFetch(`/api/rooms/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting room.');
    }
  };

  // Category Operations
  const openAddCat = () => {
    setEditingCat(null);
    setCatName('');
    setCatDesc('');
    setCatPrice('');
    setCatAmenities('');
    setErrorMessage('');
    setShowCatModal(true);
  };

  const openEditCat = (cat: RoomCategory) => {
    setEditingCat(cat);
    setCatName(cat.name || '');
    setCatDesc(cat.description || '');
    setCatPrice((cat.basePrice !== undefined && cat.basePrice !== null ? cat.basePrice : 0).toString());
    setCatAmenities((cat.amenities || []).join(', '));
    setErrorMessage('');
    setShowCatModal(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const amenitiesList = catAmenities
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    const payload = {
      name: catName,
      description: catDesc,
      basePrice: parseFloat(catPrice),
      amenities: amenitiesList
    };

    if (isNaN(payload.basePrice) || payload.basePrice <= 0) {
      setErrorMessage('Please enter a valid base price.');
      return;
    }

    try {
      if (editingCat) {
        await apiFetch(`/api/categories/${editingCat.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowCatModal(false);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving category.');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? All rooms associated with this category will fall back to Standard.')) return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error deleting category.');
    }
  };

  const filteredRooms = rooms.filter(room => {
    const statusMatch = statusFilter === 'All' || room.status === statusFilter;
    const catMatch = categoryFilter === 'All' || room.categoryId === categoryFilter;
    return statusMatch && catMatch;
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Loading hotel portfolio...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6 no-scrollbar">
      
      {/* Header and Tab Toggles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <BedDouble className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Room Portfolio</h2>
            <p className="text-xs text-slate-500 font-medium">Manage and view rooms, occupancy status, and categorical pricing details.</p>
          </div>
        </div>

        {/* View Selection Tab toggles */}
        {isAdmin && (
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'rooms' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Rooms list
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Categories
            </button>
          </div>
        )}
      </div>

      {activeTab === 'rooms' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold uppercase font-mono">
                <Filter className="h-3.5 w-3.5" />
                <span>Filters:</span>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Reserved">Reserved</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Maintenance">Maintenance</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <button
                id="add_room_btn"
                onClick={openAddRoom}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Room</span>
              </button>
            )}
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredRooms.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center border border-slate-200 rounded-xl text-slate-400 text-sm">
                No rooms match the current filter selection.
              </div>
            ) : (
              filteredRooms.map(room => {
                const category = categories.find(c => c.id === room.categoryId);
                return (
                  <div key={room.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col group hover:shadow-md transition-all">
                    {/* Room Image overlay */}
                    <div className="h-40 relative bg-slate-100 overflow-hidden shrink-0">
                      <img 
                        src={room.imageUrl || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600'} 
                        alt={`Room ${room.roomNumber}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className={`absolute top-3 right-3 text-[10px] font-bold font-mono tracking-wider uppercase px-2 py-1 rounded-full shadow-md ${
                        room.status === 'Available' ? 'bg-emerald-500 text-white' :
                        room.status === 'Occupied' ? 'bg-red-500 text-white' :
                        room.status === 'Reserved' ? 'bg-amber-500 text-white' :
                        room.status === 'Cleaning' ? 'bg-blue-500 text-white' :
                        'bg-slate-600 text-white'
                      }`}>
                        {room.status}
                      </span>
                      <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        Floor {room.floor}
                      </span>
                    </div>

                    {/* Room details */}
                    <div className="p-4 flex-1 flex flex-col gap-3 justify-between">
                      <div>
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-base font-bold text-slate-800">Room {room.roomNumber}</h4>
                          <span className="text-sm font-bold text-blue-600 font-display">{currency}{room.pricePerNight}<span className="text-[10px] text-slate-400 font-medium">/nt</span></span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">{category ? category.name : 'Uncategorized'}</p>
                        <p className="text-xs text-slate-500 mt-2">Capacity: {room.capacity} Guest{room.capacity > 1 ? 's' : ''}</p>
                      </div>

                      {/* Admin controls */}
                      {isAdmin && (
                        <div className="flex gap-2 border-t border-slate-100 pt-3 mt-1">
                          <button
                            onClick={() => openEditRoom(room)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => deleteRoom(room.id)}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                            title="Remove Room"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Categories Tab */
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              id="add_category_btn"
              onClick={openAddCat}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-base font-bold text-slate-800">{cat.name}</h3>
                    <span className="text-sm font-bold text-blue-600">{currency}{cat.basePrice}<span className="text-xs font-normal text-slate-400">/nt</span></span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{cat.description}</p>
                  
                  {/* Amenities */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cat.amenities.map(amenity => (
                      <span key={amenity} className="text-[10px] bg-slate-50 text-slate-500 border border-slate-100 px-2 py-0.5 rounded-md font-medium">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openEditCat(cat)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit category</span>
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room CRUD Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">
                {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Room'}
              </h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRoomSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Room Number</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 105"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Floor</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomFloor}
                    onChange={(e) => setRoomFloor(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Room Category</label>
                <select
                  value={roomCatId}
                  onChange={(e) => setRoomCatId(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Capacity (Guests)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Price per Night ({currency})</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomPrice}
                    onChange={(e) => setRoomPrice(e.target.value)}
                    placeholder="120"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Room Status</label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value as RoomStatus)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Reserved">Reserved</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Room Image</label>
                
                {roomImage ? (
                  <div className="flex flex-col gap-2">
                    {/* Image Preview Card */}
                    <div className="relative border border-slate-200 rounded-lg overflow-hidden h-36 bg-slate-50 flex items-center justify-center">
                      <img 
                        src={roomImage} 
                        alt="Room preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={() => setRoomImage('')}
                          className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full cursor-pointer transition-colors"
                          title="Remove Image"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {/* Read-only status indicator for base64 or URL */}
                    <input
                      type="text"
                      value={roomImage.startsWith('data:image') ? 'Uploaded Local Image (Base64)' : roomImage}
                      readOnly
                      className="border border-slate-200/60 rounded-lg px-3 py-1.5 text-[10px] text-slate-400 bg-slate-50 font-mono outline-none"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('room-image-upload')?.click()}
                      className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50/40 text-blue-600' 
                          : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 text-slate-500'
                      }`}
                    >
                      <UploadCloud className="h-7 w-7 text-slate-400 group-hover:text-blue-500" />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-700">Drag and drop image here</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">or click to select file from device (PNG, JPG, max 5MB)</p>
                      </div>
                      <input
                        id="room-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    {/* Divider */}
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-150"></div>
                      <span className="flex-shrink mx-3 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">or</span>
                      <div className="flex-grow border-t border-slate-150"></div>
                    </div>

                    {/* Fallback image URL text input */}
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={roomImage}
                        onChange={(e) => setRoomImage(e.target.value)}
                        placeholder="Paste an image URL (e.g., https://unsplash.com/...)"
                        className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                {editingRoom ? 'Update Room Details' : 'Register New Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Category CRUD Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">
                {editingCat ? `Edit Category: ${editingCat.name}` : 'Add New Category'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCatSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Category Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Deluxe Room"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Description</label>
                <textarea
                  required
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Detailed description of room size, scenery, and accommodations..."
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Base Price per Night ({currency})</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={catPrice}
                  onChange={(e) => setCatPrice(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Amenities (comma separated)</label>
                <input
                  type="text"
                  required
                  value={catAmenities}
                  onChange={(e) => setCatAmenities(e.target.value)}
                  placeholder="Free Wi-Fi, Air Conditioning, Smart TV..."
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                {editingCat ? 'Update Category Details' : 'Register New Category'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
