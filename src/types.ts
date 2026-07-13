/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'Admin' | 'Receptionist' | 'Accountant';

export type RoomStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Maintenance';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Checked-in' | 'Checked-out' | 'Cancelled';

export type PaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer' | 'Card';

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface User {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  username: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  passwordHash: string; // Stored for session validation
  createdAt: string;
}

export interface RoomCategory {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  amenities: string[];
}

export interface Room {
  id: string;
  roomNumber: string;
  categoryId: string;
  floor: number;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
  imageUrl?: string;
}

export interface Guest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  idType: string;
  idNumber: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
}

export interface Reservation {
  id: string;
  guestId: string;
  bookingStatus: BookingStatus;
  checkInDate: string; // ISO date string YYYY-MM-DD
  checkOutDate: string; // ISO date string YYYY-MM-DD
  totalPrice: number;
  paidAmount: number;
  depositAmount: number;
  createdAt: string;
  rooms: string[]; // List of Room IDs reserved
}

export interface Invoice {
  id: string;
  reservationId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  isPaid: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: string;
  referenceNumber: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSetting {
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  taxRate: number; // e.g. 0.15 for 15%
  currency: string; // e.g. '$' or '€' or 'UGX'
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  recordedBy: string;
  createdAt: string;
  attachment?: string; // base64 encoded string or data URL
  attachmentName?: string; // name of the attached receipt file
}

export interface HandoverTask {
  id: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes?: string;
}

export interface ShiftHandover {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: UserRole;
  toRole?: UserRole | 'All';
  notes: string;
  tasks: HandoverTask[];
  status: 'Active' | 'Completed';
  createdAt: string;
  acknowledgedBy: string[];
}


