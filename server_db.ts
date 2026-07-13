/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { 
  User, RoomCategory, Room, Guest, Reservation, Invoice, 
  InvoiceItem, Payment, AuditLog, SystemSetting, Notification,
  UserRole, RoomStatus, BookingStatus, PaymentMethod, Expense,
  ShiftHandover, HandoverTask
} from './src/types';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initial default data
const DEFAULT_DATA = {
  users: [
    {
      id: 'usr_1',
      name: 'John Doe',
      position: 'Hotel Administrator',
      phone: '+1 555-0101',
      email: 'admin@hotel.com',
      username: 'admin',
      role: 'Admin' as UserRole,
      status: 'Active' as const,
      passwordHash: 'admin123', // Simple text password for demo login
      createdAt: '2026-01-01T08:00:00Z'
    },
    {
      id: 'usr_2',
      name: 'Sarah Connor',
      position: 'Front Desk Receptionist',
      phone: '+1 555-0102',
      email: 'reception@hotel.com',
      username: 'receptionist',
      role: 'Receptionist' as UserRole,
      status: 'Active' as const,
      passwordHash: 'reception123',
      createdAt: '2026-01-05T09:30:00Z'
    },
    {
      id: 'usr_3',
      name: 'Michael Scott',
      position: 'Head Accountant',
      phone: '+1 555-0103',
      email: 'accounting@hotel.com',
      username: 'accountant',
      role: 'Accountant' as UserRole,
      status: 'Active' as const,
      passwordHash: 'accountant123',
      createdAt: '2026-01-10T10:15:00Z'
    }
  ],
  roomCategories: [
    {
      id: 'cat_standard',
      name: 'Standard Room',
      description: 'Cozy and cost-effective room perfect for single travelers or couples.',
      basePrice: 80,
      amenities: ['Queen Bed', 'Free Wi-Fi', 'Smart TV', 'Air Conditioning', 'Shower']
    },
    {
      id: 'cat_deluxe',
      name: 'Deluxe Room',
      description: 'Spacious room featuring modern design, high-end amenities, and city views.',
      basePrice: 130,
      amenities: ['King Bed', 'Free Wi-Fi', 'Smart TV', 'Air Conditioning', 'Shower & Bath', 'Mini Fridge', 'Work Desk']
    },
    {
      id: 'cat_executive',
      name: 'Executive Room',
      description: 'Sophisticated design tailored for business executives, featuring lounge access.',
      basePrice: 190,
      amenities: ['King Bed', 'Free Wi-Fi', '4K Smart TV', 'Air Conditioning', 'Bathtub & Rain Shower', 'Mini Bar', 'Executive Desk', 'Coffee Machine']
    },
    {
      id: 'cat_suite',
      name: 'Luxury Suite',
      description: 'An elegant suite with a separate living room, dining area, and premium furnishings.',
      basePrice: 280,
      amenities: ['King Bed & Sofa Bed', 'Separate Living Room', 'Free Wi-Fi', 'Two Smart TVs', 'Mini Bar', 'Private Balcony', 'Jacuzzi', '24/7 Room Service']
    },
    {
      id: 'cat_presidential',
      name: 'Presidential Suite',
      description: 'The ultimate pinnacle of luxury. Massive layout, private butler service, and panoramic views.',
      basePrice: 500,
      amenities: ['2 King Beds', 'Grand Living Area', 'Dining Table for 6', 'Fully Equipped Kitchenette', 'Panoramic Balcony', 'Private Jacuzzi', 'Personal Butler Service', 'Premium Sound System']
    }
  ],
  rooms: [
    { id: 'rm_101', roomNumber: '101', categoryId: 'cat_standard', floor: 1, capacity: 2, pricePerNight: 80, status: 'Available' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_102', roomNumber: '102', categoryId: 'cat_standard', floor: 1, capacity: 2, pricePerNight: 80, status: 'Available' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_103', roomNumber: '103', categoryId: 'cat_standard', floor: 1, capacity: 2, pricePerNight: 80, status: 'Cleaning' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_104', roomNumber: '104', categoryId: 'cat_deluxe', floor: 1, capacity: 3, pricePerNight: 130, status: 'Occupied' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_105', roomNumber: '105', categoryId: 'cat_deluxe', floor: 1, capacity: 3, pricePerNight: 130, status: 'Available' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_201', roomNumber: '201', categoryId: 'cat_deluxe', floor: 2, capacity: 3, pricePerNight: 130, status: 'Reserved' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_202', roomNumber: '202', categoryId: 'cat_executive', floor: 2, capacity: 2, pricePerNight: 190, status: 'Available' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_203', roomNumber: '203', categoryId: 'cat_executive', floor: 2, capacity: 2, pricePerNight: 190, status: 'Maintenance' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_301', roomNumber: '301', categoryId: 'cat_suite', floor: 3, capacity: 4, pricePerNight: 280, status: 'Available' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=600' },
    { id: 'rm_302', roomNumber: '302', categoryId: 'cat_presidential', floor: 3, capacity: 6, pricePerNight: 500, status: 'Occupied' as RoomStatus, imageUrl: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&q=80&w=600' }
  ],
  guests: [
    {
      id: 'gst_1',
      fullName: 'Alice Smith',
      phone: '+1 555-0201',
      email: 'alice@example.com',
      nationality: 'USA',
      idType: 'Passport',
      idNumber: 'US87654321',
      address: '123 Pine St, New York, NY',
      emergencyContact: {
        name: 'Bob Smith',
        phone: '+1 555-0202',
        relationship: 'Spouse'
      },
      createdAt: '2026-06-15T14:00:00Z'
    },
    {
      id: 'gst_2',
      fullName: 'Jean Dupont',
      phone: '+33 6 1234 5678',
      email: 'jean.dupont@example.fr',
      nationality: 'France',
      idType: 'National ID',
      idNumber: 'FR99887766',
      address: '45 Rue de la Paix, Paris',
      emergencyContact: {
        name: 'Marie Dupont',
        phone: '+33 6 8765 4321',
        relationship: 'Mother'
      },
      createdAt: '2026-06-20T11:20:00Z'
    },
    {
      id: 'gst_3',
      fullName: 'Yuki Tanaka',
      phone: '+81 90-1234-5678',
      email: 'yuki@example.jp',
      nationality: 'Japan',
      idType: 'Passport',
      idNumber: 'JP11223344',
      address: '2-1-1 Nihonbashi, Chuo-ku, Tokyo',
      emergencyContact: {
        name: 'Ken Tanaka',
        phone: '+81 90-8762-1144',
        relationship: 'Brother'
      },
      createdAt: '2026-06-25T16:45:00Z'
    }
  ],
  reservations: [
    {
      id: 'res_1',
      guestId: 'gst_1',
      bookingStatus: 'Checked-in' as BookingStatus,
      checkInDate: '2026-07-08',
      checkOutDate: '2026-07-12',
      totalPrice: 520, // 4 nights at 130
      paidAmount: 200, // Partial deposit
      depositAmount: 200,
      createdAt: '2026-07-01T10:00:00Z',
      rooms: ['rm_104']
    },
    {
      id: 'res_2',
      guestId: 'gst_2',
      bookingStatus: 'Checked-in' as BookingStatus,
      checkInDate: '2026-07-09',
      checkOutDate: '2026-07-14',
      totalPrice: 2500, // 5 nights at 500
      paidAmount: 2500, // Fully paid
      depositAmount: 500,
      createdAt: '2026-07-02T15:30:00Z',
      rooms: ['rm_302']
    },
    {
      id: 'res_3',
      guestId: 'gst_3',
      bookingStatus: 'Confirmed' as BookingStatus,
      checkInDate: '2026-07-15',
      checkOutDate: '2026-07-18',
      totalPrice: 390, // 3 nights at 130
      paidAmount: 0,
      depositAmount: 100,
      createdAt: '2026-07-05T12:00:00Z',
      rooms: ['rm_201']
    }
  ],
  invoices: [
    {
      id: 'inv_1',
      reservationId: 'res_1',
      invoiceNumber: 'INV-2026-0001',
      issueDate: '2026-07-08',
      dueDate: '2026-07-12',
      subTotal: 520,
      taxAmount: 78, // 15% VAT
      discountAmount: 0,
      grandTotal: 598,
      isPaid: false,
      createdAt: '2026-07-08T14:30:00Z'
    },
    {
      id: 'inv_2',
      reservationId: 'res_2',
      invoiceNumber: 'INV-2026-0002',
      issueDate: '2026-07-09',
      dueDate: '2026-07-14',
      subTotal: 2500,
      taxAmount: 375, // 15% VAT
      discountAmount: 100, // Premium discount
      grandTotal: 2775,
      isPaid: true,
      createdAt: '2026-07-09T11:15:00Z'
    }
  ],
  invoiceItems: [
    { id: 'item_1_1', invoiceId: 'inv_1', description: 'Room 104 stay (4 nights x $130)', quantity: 4, unitPrice: 130, totalPrice: 520 },
    { id: 'item_2_1', invoiceId: 'inv_2', description: 'Room 302 stay (5 nights x $500)', quantity: 5, unitPrice: 500, totalPrice: 2500 }
  ],
  payments: [
    {
      id: 'pay_1',
      invoiceId: 'inv_1',
      paymentMethod: 'Card' as PaymentMethod,
      amount: 200,
      paymentDate: '2026-07-08T14:35:00Z',
      referenceNumber: 'REF9918231',
      notes: 'Initial check-in security deposit'
    },
    {
      id: 'pay_2',
      invoiceId: 'inv_2',
      paymentMethod: 'Bank Transfer' as PaymentMethod,
      amount: 2775,
      paymentDate: '2026-07-09T11:20:00Z',
      referenceNumber: 'TXN-FR-88910',
      notes: 'Full payment on check-in'
    }
  ],
  auditLogs: [
    { id: 'log_1', userId: 'usr_1', username: 'admin', action: 'System Setup', details: 'Initialized database default schema and values.', timestamp: '2026-01-01T08:00:00Z' },
    { id: 'log_2', userId: 'usr_2', username: 'receptionist', action: 'Booking Creation', details: 'Created reservation res_1 for Alice Smith.', timestamp: '2026-07-01T10:05:00Z' },
    { id: 'log_3', userId: 'usr_2', username: 'receptionist', action: 'Check-in Guest', details: 'Checked-in Alice Smith to Room 104.', timestamp: '2026-07-08T14:30:00Z' }
  ],
  settings: {
    hotelName: 'Grand Horizon Resort & Spa',
    hotelAddress: 'Accra, Ghana',
    hotelPhone: '+233 24 000 0000',
    hotelEmail: 'reservations@grandhorizon.com.gh',
    taxRate: 0.15,
    currency: 'GH₵'
  },
  notifications: [
    { id: 'ntf_1', message: 'Guest Jean Dupont check-in is today (Room 302)', type: 'info' as const, isRead: false, timestamp: '2026-07-09T08:00:00Z' },
    { id: 'ntf_2', message: 'Security deposit payment of $200 recorded for Alice Smith', type: 'success' as const, isRead: true, timestamp: '2026-07-08T14:35:00Z' },
    { id: 'ntf_3', message: 'Room 203 is marked for Maintenance', type: 'warning' as const, isRead: false, timestamp: '2026-07-10T08:00:00Z' }
  ],
  expenses: [
    {
      id: 'exp_1',
      description: 'Monthly Electricity & Water Utility Bill',
      amount: 450,
      category: 'Utilities',
      date: '2026-07-05',
      recordedBy: 'Michael Scott',
      createdAt: '2026-07-05T10:00:00Z'
    },
    {
      id: 'exp_2',
      description: 'Hotel Laundry Detergents and Room Cleaning Supplies',
      amount: 180,
      category: 'Maintenance',
      date: '2026-07-08',
      recordedBy: 'Michael Scott',
      createdAt: '2026-07-08T11:30:00Z'
    },
    {
      id: 'exp_3',
      description: 'Reception Desk Stationery and Keycard Replacements',
      amount: 65,
      category: 'Office Supplies',
      date: '2026-07-09',
      recordedBy: 'Sarah Connor',
      createdAt: '2026-07-09T14:15:00Z'
    }
  ],
  shiftHandovers: [
    {
      id: 'ho_1',
      fromUserId: 'usr_2',
      fromUserName: 'Sarah Connor',
      fromUserRole: 'Receptionist' as UserRole,
      toRole: 'All' as const,
      notes: 'Morning shift went smoothly. Handed over cash box with exactly GH₵1,500. Room 104 requested late checkout at 1:00 PM.',
      tasks: [
        { id: 't1', description: 'Confirm Room 104 check-out at 1:00 PM', status: 'Pending' as const },
        { id: 't2', description: 'Verify card reader receipt batch terminal', status: 'Completed' as const, notes: 'Done, match printed' }
      ],
      status: 'Active' as const,
      createdAt: '2026-07-10T12:00:00Z',
      acknowledgedBy: []
    }
  ]
};

interface DatabaseData {
  users: User[];
  roomCategories: RoomCategory[];
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  auditLogs: AuditLog[];
  settings: {
    hotelName: string;
    hotelAddress: string;
    hotelPhone: string;
    hotelEmail: string;
    taxRate: number;
    currency: string;
    website?: string;
    currencySymbol?: string;
    vatTaxRate?: number;
  };
  notifications: Notification[];
  expenses: Expense[];
  shiftHandovers: ShiftHandover[];
}

class Database {
  private data: DatabaseData;

  constructor() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    this.load();
  }

  private load() {
    try {
      ensureDataDir();
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (!this.data.expenses) {
          this.data.expenses = [];
        }
        if (!this.data.shiftHandovers) {
          this.data.shiftHandovers = [];
        }
        if (this.data.settings) {
          if (!this.data.settings.currency || this.data.settings.currency === '$') {
            this.data.settings.currency = 'GH₵';
          }
          if (!this.data.settings.currencySymbol || this.data.settings.currencySymbol === '$') {
            this.data.settings.currencySymbol = 'GH₵';
          }
        }
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading DB, keeping in-memory:', e);
    }
  }

  public save() {
    try {
      ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB:', e);
    }
  }

  // --- Users/Staff ---
  getUsers() { return this.data.users; }
  getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  getUserByUsername(username: string) { return this.data.users.find(u => u.username === username); }
  createUser(user: Omit<User, 'id' | 'createdAt'>) {
    const newUser: User = {
      ...user,
      id: 'usr_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    return this.data.users[idx];
  }
  deleteUser(id: string) {
    const filtered = this.data.users.filter(u => u.id !== id);
    if (filtered.length === this.data.users.length) return false;
    this.data.users = filtered;
    this.save();
    return true;
  }

  // --- Room Categories ---
  getCategories() { return this.data.roomCategories; }
  getCategoryById(id: string) { return this.data.roomCategories.find(c => c.id === id); }
  createCategory(cat: Omit<RoomCategory, 'id'>) {
    const newCat: RoomCategory = {
      ...cat,
      id: 'cat_' + Date.now()
    };
    this.data.roomCategories.push(newCat);
    this.save();
    return newCat;
  }
  updateCategory(id: string, updates: Partial<RoomCategory>) {
    const idx = this.data.roomCategories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.roomCategories[idx] = { ...this.data.roomCategories[idx], ...updates };
    this.save();
    return this.data.roomCategories[idx];
  }
  deleteCategory(id: string) {
    this.data.roomCategories = this.data.roomCategories.filter(c => c.id !== id);
    // Cascade Category deletion to rooms (by assigning Standard or null)
    this.data.rooms.forEach(r => {
      if (r.categoryId === id) {
        r.categoryId = 'cat_standard';
      }
    });
    this.save();
    return true;
  }

  // --- Rooms ---
  getRooms() { return this.data.rooms; }
  getRoomById(id: string) { return this.data.rooms.find(r => r.id === id); }
  createRoom(room: Omit<Room, 'id'>) {
    const newRoom: Room = {
      ...room,
      id: 'rm_' + Date.now()
    };
    this.data.rooms.push(newRoom);
    this.save();
    return newRoom;
  }
  updateRoom(id: string, updates: Partial<Room>) {
    const idx = this.data.rooms.findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.data.rooms[idx] = { ...this.data.rooms[idx], ...updates };
    this.save();
    return this.data.rooms[idx];
  }
  deleteRoom(id: string) {
    const filtered = this.data.rooms.filter(r => r.id !== id);
    if (filtered.length === this.data.rooms.length) return false;
    this.data.rooms = filtered;
    this.save();
    return true;
  }

  // --- Guests ---
  getGuests() { return this.data.guests; }
  getGuestById(id: string) { return this.data.guests.find(g => g.id === id); }
  createGuest(guest: Omit<Guest, 'id' | 'createdAt'>) {
    const newGuest: Guest = {
      ...guest,
      id: 'gst_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.data.guests.push(newGuest);
    this.save();
    return newGuest;
  }
  updateGuest(id: string, updates: Partial<Guest>) {
    const idx = this.data.guests.findIndex(g => g.id === id);
    if (idx === -1) return null;
    this.data.guests[idx] = { ...this.data.guests[idx], ...updates };
    this.save();
    return this.data.guests[idx];
  }
  deleteGuest(id: string) {
    this.data.guests = this.data.guests.filter(g => g.id !== id);
    this.save();
    return true;
  }

  // --- Reservations ---
  getReservations() { return this.data.reservations; }
  getReservationById(id: string) { return this.data.reservations.find(r => r.id === id); }
  createReservation(res: Omit<Reservation, 'id' | 'createdAt'>) {
    const newRes: Reservation = {
      ...res,
      id: 'res_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    this.data.reservations.push(newRes);

    // Update Room statuses if reservation is active/checked-in
    if (newRes.bookingStatus === 'Checked-in') {
      newRes.rooms.forEach(rmId => {
        this.updateRoom(rmId, { status: 'Occupied' });
      });
    } else if (newRes.bookingStatus === 'Confirmed' || newRes.bookingStatus === 'Pending') {
      newRes.rooms.forEach(rmId => {
        const room = this.getRoomById(rmId);
        if (room && room.status === 'Available') {
          this.updateRoom(rmId, { status: 'Reserved' });
        }
      });
    }

    this.save();
    return newRes;
  }
  updateReservation(id: string, updates: Partial<Reservation>) {
    const idx = this.data.reservations.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const oldStatus = this.data.reservations[idx].bookingStatus;
    const rooms = this.data.reservations[idx].rooms;

    this.data.reservations[idx] = { ...this.data.reservations[idx], ...updates };
    const newStatus = this.data.reservations[idx].bookingStatus;

    // Side effect check for Room status updates
    if (oldStatus !== newStatus) {
      if (newStatus === 'Checked-in') {
        rooms.forEach(rmId => this.updateRoom(rmId, { status: 'Occupied' }));
      } else if (newStatus === 'Checked-out') {
        rooms.forEach(rmId => this.updateRoom(rmId, { status: 'Cleaning' }));
      } else if (newStatus === 'Cancelled') {
        rooms.forEach(rmId => {
          const room = this.getRoomById(rmId);
          if (room && room.status === 'Reserved') {
            this.updateRoom(rmId, { status: 'Available' });
          }
        });
      }
    }

    this.save();
    return this.data.reservations[idx];
  }
  deleteReservation(id: string) {
    const idx = this.data.reservations.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const rooms = this.data.reservations[idx].rooms;
    rooms.forEach(rmId => {
      const room = this.getRoomById(rmId);
      if (room && (room.status === 'Reserved' || room.status === 'Occupied')) {
        this.updateRoom(rmId, { status: 'Available' });
      }
    });

    this.data.reservations = this.data.reservations.filter(r => r.id !== id);
    this.save();
    return true;
  }

  // --- Invoices & Items ---
  getInvoices() { return this.data.invoices; }
  getInvoiceById(id: string) { return this.data.invoices.find(i => i.id === id); }
  getInvoiceByReservationId(resId: string) { return this.data.invoices.find(i => i.reservationId === resId); }
  getInvoiceItems(invoiceId: string) { return this.data.invoiceItems.filter(item => item.invoiceId === invoiceId); }
  
  createInvoice(inv: Omit<Invoice, 'id' | 'createdAt' | 'invoiceNumber'>, items: Omit<InvoiceItem, 'id' | 'invoiceId' | 'totalPrice'>[]) {
    const id = 'inv_' + Date.now();
    const invoiceNumber = 'INV-' + new Date().getFullYear() + '-' + String(this.data.invoices.length + 1).padStart(4, '0');
    
    const newInvoice: Invoice = {
      ...inv,
      id,
      invoiceNumber,
      createdAt: new Date().toISOString()
    };

    const savedItems: InvoiceItem[] = items.map((item, index) => {
      const totalPrice = item.quantity * item.unitPrice;
      return {
        ...item,
        id: `item_${id}_${index}`,
        invoiceId: id,
        totalPrice
      };
    });

    this.data.invoices.push(newInvoice);
    this.data.invoiceItems.push(...savedItems);
    this.save();

    return { invoice: newInvoice, items: savedItems };
  }

  updateInvoice(id: string, updates: Partial<Invoice>) {
    const idx = this.data.invoices.findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.data.invoices[idx] = { ...this.data.invoices[idx], ...updates };
    this.save();
    return this.data.invoices[idx];
  }

  processPOSCheckout(
    transactionType: 'room-charge' | 'direct',
    items: { description: string; quantity: number; unitPrice: number }[],
    reservationId: string,
    paymentMethod: PaymentMethod | 'Mobile Money',
    userId: string,
    username: string
  ) {
    const currency = this.data.settings.currency;
    const taxRate = this.data.settings.taxRate || 0.15;
    const newSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const newTax = Math.round(newSubtotal * taxRate * 100) / 100;
    const newGrandTotal = newSubtotal + newTax;

    if (transactionType === 'room-charge') {
      const reservation = this.getReservationById(reservationId);
      if (!reservation) throw new Error('Reservation not found');
      
      const invoice = this.getInvoiceByReservationId(reservationId);
      if (!invoice) throw new Error('Invoice not found for this reservation');

      const guest = this.getGuestById(reservation.guestId);

      // Append items to invoiceItems
      const savedItems = items.map((item, index) => {
        const totalPrice = item.quantity * item.unitPrice;
        const newItem = {
          id: `item_pos_${Date.now()}_${index}`,
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice
        };
        this.data.invoiceItems.push(newItem);
        return newItem;
      });

      // Update invoice totals
      invoice.subTotal = Math.round((invoice.subTotal + newSubtotal) * 100) / 100;
      invoice.taxAmount = Math.round((invoice.taxAmount + newTax) * 100) / 100;
      invoice.grandTotal = Math.round((invoice.grandTotal + newGrandTotal) * 100) / 100;

      // Recalculate invoice isPaid
      const payments = this.getPaymentsByInvoiceId(invoice.id);
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      invoice.isPaid = totalPaid >= invoice.grandTotal;

      this.createAuditLog(
        userId,
        username,
        'POS Sale (Room Charge)',
        `POS items charged to Room ${reservation.rooms.join(', ')} (${guest?.fullName || 'Guest'}): ` +
        items.map(i => `${i.quantity}x ${i.description}`).join(', ') + 
        `. Total added: ${currency}${newGrandTotal}`
      );

      this.save();
      return { success: true, type: 'room-charge', invoiceId: invoice.id, addedAmount: newGrandTotal };

    } else {
      // Direct Sale
      const invoiceId = 'inv_pos_' + Date.now();
      const invoiceNumber = 'INV-POS-' + new Date().getFullYear() + '-' + String(this.data.invoices.length + 1).padStart(4, '0');
      
      const newInvoice = {
        id: invoiceId,
        reservationId: 'walk-in',
        invoiceNumber,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        subTotal: newSubtotal,
        taxAmount: newTax,
        discountAmount: 0,
        grandTotal: newGrandTotal,
        isPaid: true,
        createdAt: new Date().toISOString()
      };

      const savedItems = items.map((item, index) => {
        const totalPrice = item.quantity * item.unitPrice;
        return {
          id: `item_${invoiceId}_${index}`,
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice
        };
      });

      const paymentId = 'pay_' + Date.now();
      const newPayment = {
        id: paymentId,
        invoiceId,
        paymentMethod: paymentMethod as any,
        amount: newGrandTotal,
        paymentDate: new Date().toISOString(),
        referenceNumber: 'POS-' + Date.now().toString().slice(-6),
        notes: 'Walk-in Front Desk POS Purchase'
      };

      this.data.invoices.push(newInvoice);
      this.data.invoiceItems.push(...savedItems);
      this.data.payments.push(newPayment);

      this.createAuditLog(
        userId,
        username,
        'POS Direct Sale',
        `POS walk-in sale completed (${paymentMethod}): ` +
        items.map(i => `${i.quantity}x ${i.description}`).join(', ') + 
        `. Total paid: ${currency}${newGrandTotal}`
      );

      this.save();
      return { success: true, type: 'direct', invoiceId, paymentId, total: newGrandTotal };
    }
  }

  // --- Payments ---
  getPayments() { return this.data.payments; }
  getPaymentsByInvoiceId(invoiceId: string) { return this.data.payments.filter(p => p.invoiceId === invoiceId); }
  
  createPayment(pay: Omit<Payment, 'id' | 'paymentDate'>) {
    const newPayment: Payment = {
      ...pay,
      id: 'pay_' + Date.now(),
      paymentDate: new Date().toISOString()
    };

    this.data.payments.push(newPayment);

    // Update invoice status and reservation paidAmount
    const invoice = this.getInvoiceById(pay.invoiceId);
    if (invoice) {
      const allPayments = this.getPaymentsByInvoiceId(pay.invoiceId);
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const isPaid = totalPaid >= invoice.grandTotal;
      this.updateInvoice(invoice.id, { isPaid });

      // Update Reservation paid amount
      const reservation = this.getReservationById(invoice.reservationId);
      if (reservation) {
        this.updateReservation(reservation.id, {
          paidAmount: totalPaid
        });
      }
    }

    this.save();
    return newPayment;
  }

  // --- Audit Logs ---
  getAuditLogs() { return this.data.auditLogs; }
  createAuditLog(userId: string, username: string, action: string, details: string) {
    const newLog: AuditLog = {
      id: 'log_' + Date.now(),
      userId,
      username,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(newLog); // Newest first
    this.save();
    return newLog;
  }

  // --- Settings ---
  getSettings() { return this.data.settings; }
  updateSettings(updates: Partial<SystemSetting>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // --- Notifications ---
  getNotifications() { return this.data.notifications; }
  createNotification(message: string, type: 'info' | 'success' | 'warning' | 'error') {
    const newNtf: Notification = {
      id: 'ntf_' + Date.now(),
      message,
      type,
      isRead: false,
      timestamp: new Date().toISOString()
    };
    this.data.notifications.unshift(newNtf); // Newest first
    this.save();
    return newNtf;
  }
  markNotificationAsRead(id: string) {
    const idx = this.data.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      this.data.notifications[idx].isRead = true;
      this.save();
      return true;
    }
    return false;
  }
  markAllNotificationsAsRead() {
    this.data.notifications.forEach(n => n.isRead = true);
    this.save();
    return true;
  }

  // --- Advanced Operations (Check-In & Check-Out) ---
  checkInReservation(resId: string, depositAmount: number, paymentMethod: PaymentMethod, userId: string, username: string) {
    const reservation = this.getReservationById(resId);
    if (!reservation) throw new Error('Reservation not found');

    // Update reservation status
    this.updateReservation(resId, { 
      bookingStatus: 'Checked-in',
      depositAmount
    });

    // Check if invoice already exists
    let invoice = this.getInvoiceByReservationId(resId);
    let items: InvoiceItem[] = [];

    if (!invoice) {
      // Calculate Room Charges
      const guest = this.getGuestById(reservation.guestId);
      const days = Math.max(1, Math.ceil((new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24)));
      
      const subTotal = reservation.totalPrice;
      const taxAmount = Math.round(subTotal * this.data.settings.taxRate * 100) / 100;
      const grandTotal = subTotal + taxAmount;

      const itemDetails = [{
        description: `Room accommodation charges (${days} nights x ${reservation.totalPrice / days})`,
        quantity: days,
        unitPrice: reservation.totalPrice / days
      }];

      const invoiceRes = this.createInvoice({
        reservationId: resId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: reservation.checkOutDate,
        subTotal,
        taxAmount,
        discountAmount: 0,
        grandTotal,
        isPaid: false
      }, itemDetails);

      invoice = invoiceRes.invoice;
      items = invoiceRes.items;
    }

    // Record Deposit as Payment if > 0
    if (depositAmount > 0) {
      this.createPayment({
        invoiceId: invoice.id,
        paymentMethod,
        amount: depositAmount,
        referenceNumber: 'DEP-' + Date.now().toString().slice(-6),
        notes: 'Reservation Check-In Security Deposit'
      });
    }

    this.createAuditLog(userId, username, 'Check-In Guest', `Checked-in reservation ${resId} for guest ${reservation.guestId}. Recorded deposit of ${this.data.settings.currency}${depositAmount}.`);
    this.createNotification(`Check-in complete for ${this.getGuestById(reservation.guestId)?.fullName || 'Guest'}. Room is now occupied.`, 'success');

    return { reservation, invoice, items };
  }

  checkOutReservation(resId: string, extraCharges: number, discountAmount: number, userId: string, username: string) {
    const reservation = this.getReservationById(resId);
    if (!reservation) throw new Error('Reservation not found');

    // Update reservation status to Checked-out
    this.updateReservation(resId, { bookingStatus: 'Checked-out' });

    // Update Invoice with extra services & discounts
    const invoice = this.getInvoiceByReservationId(resId);
    if (invoice) {
      const subTotal = invoice.subTotal + extraCharges;
      const taxAmount = Math.round((subTotal - discountAmount) * this.data.settings.taxRate * 100) / 100;
      const grandTotal = Math.max(0, (subTotal - discountAmount) + taxAmount);

      this.updateInvoice(invoice.id, {
        subTotal,
        discountAmount,
        taxAmount,
        grandTotal
      });

      // If extraCharges > 0, add an Invoice Item
      if (extraCharges > 0) {
        const id = `item_${invoice.id}_extra_${Date.now()}`;
        this.data.invoiceItems.push({
          id,
          invoiceId: invoice.id,
          description: 'Extra Services / Incidental Charges',
          quantity: 1,
          unitPrice: extraCharges,
          totalPrice: extraCharges
        });
      }
    }

    const guest = this.getGuestById(reservation.guestId);
    this.createAuditLog(userId, username, 'Check-Out Guest', `Checked-out reservation ${resId} for guest ${guest?.fullName || 'unknown'}. Additional charges: ${this.data.settings.currency}${extraCharges}.`);
    this.createNotification(`Check-out complete for ${guest?.fullName || 'Guest'}. Room updated to Cleaning status.`, 'success');

    return { reservation, invoice: this.getInvoiceById(invoice?.id || '') };
  }

  // --- Expenses ---
  getExpenses() {
    return this.data.expenses || [];
  }

  createExpense(expense: Omit<Expense, 'id' | 'createdAt'>) {
    const newExpense: Expense = {
      ...expense,
      id: 'exp_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    if (!this.data.expenses) {
      this.data.expenses = [];
    }
    this.data.expenses.push(newExpense);
    this.save();
    return newExpense;
  }

  deleteExpense(id: string) {
    if (!this.data.expenses) {
      this.data.expenses = [];
    }
    const filtered = this.data.expenses.filter(e => e.id !== id);
    if (filtered.length === this.data.expenses.length) return false;
    this.data.expenses = filtered;
    this.save();
    return true;
  }

  // --- Shift Handovers ---
  getShiftHandovers() {
    return this.data.shiftHandovers || [];
  }

  createShiftHandover(handover: Omit<ShiftHandover, 'id' | 'createdAt' | 'acknowledgedBy'>) {
    const newHandover: ShiftHandover = {
      ...handover,
      id: 'ho_' + Date.now(),
      createdAt: new Date().toISOString(),
      acknowledgedBy: []
    };
    if (!this.data.shiftHandovers) {
      this.data.shiftHandovers = [];
    }
    this.data.shiftHandovers.push(newHandover);
    this.save();
    return newHandover;
  }

  updateShiftHandover(id: string, updates: Partial<ShiftHandover>) {
    if (!this.data.shiftHandovers) {
      this.data.shiftHandovers = [];
    }
    const idx = this.data.shiftHandovers.findIndex(h => h.id === id);
    if (idx === -1) return null;

    this.data.shiftHandovers[idx] = {
      ...this.data.shiftHandovers[idx],
      ...updates
    };
    this.save();
    return this.data.shiftHandovers[idx];
  }

  acknowledgeShiftHandover(id: string, userId: string) {
    if (!this.data.shiftHandovers) {
      this.data.shiftHandovers = [];
    }
    const idx = this.data.shiftHandovers.findIndex(h => h.id === id);
    if (idx === -1) return null;

    const handover = this.data.shiftHandovers[idx];
    if (!handover.acknowledgedBy.includes(userId)) {
      handover.acknowledgedBy.push(userId);
    }
    this.save();
    return handover;
  }

  // --- Statistics Analytics ---
  getDashboardStats() {
    const totalRooms = this.data.rooms.length;
    const availableRooms = this.data.rooms.filter(r => r.status === 'Available').length;
    const occupiedRooms = this.data.rooms.filter(r => r.status === 'Occupied').length;
    const reservedRooms = this.data.rooms.filter(r => r.status === 'Reserved').length;
    const cleaningRooms = this.data.rooms.filter(r => r.status === 'Cleaning').length;
    const maintenanceRooms = this.data.rooms.filter(r => r.status === 'Maintenance').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckIns = this.data.reservations.filter(r => r.checkInDate === todayStr).length;
    const todayCheckOuts = this.data.reservations.filter(r => r.checkOutDate === todayStr).length;

    // Revenue calculation
    const allPayments = this.data.payments;
    const todayRevenue = allPayments
      .filter(p => p.paymentDate.startsWith(todayStr))
      .reduce((sum, p) => sum + p.amount, 0);

    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyRevenue = allPayments
      .filter(p => p.paymentDate.startsWith(currentMonthPrefix))
      .reduce((sum, p) => sum + p.amount, 0);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Charts calculation: Monthly Revenue (Last 6 Months)
    const monthlyRevChart = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthPrefix = d.toISOString().slice(0, 7);
      const label = d.toLocaleString('default', { month: 'short' });
      const rev = allPayments
        .filter(p => p.paymentDate.startsWith(monthPrefix))
        .reduce((sum, p) => sum + p.amount, 0);
      return { month: label, revenue: rev, prefix: monthPrefix };
    }).reverse();

    // Booking Trends (Last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const count = this.data.reservations.filter(r => r.createdAt.startsWith(dayStr)).length;
      return { date: d.toLocaleDateString('default', { weekday: 'short', day: 'numeric' }), bookings: count, dateStr: dayStr };
    }).reverse();

    // Occupancy Stats by Category
    const categoryOccupancy = this.data.roomCategories.map(cat => {
      const catRooms = this.data.rooms.filter(r => r.categoryId === cat.id);
      const occupiedCatRooms = catRooms.filter(r => r.status === 'Occupied').length;
      const rate = catRooms.length > 0 ? Math.round((occupiedCatRooms / catRooms.length) * 100) : 0;
      return { name: cat.name, rate, count: catRooms.length, occupied: occupiedCatRooms };
    });

    return {
      cards: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        reservedRooms,
        cleaningRooms,
        maintenanceRooms,
        todayCheckIns,
        todayCheckOuts,
        todayRevenue,
        monthlyRevenue,
        occupancyRate
      },
      charts: {
        monthlyRevenue: monthlyRevChart,
        bookingTrends: last7Days,
        categoryOccupancy
      }
    };
  }
}

export const db = new Database();
