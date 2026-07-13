/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server_db';
import { PaymentMethod } from './src/types';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Authentication Middleware ---
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'Admin' | 'Receptionist' | 'Accountant';
    name: string;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    // For demo MVP, we decode the base64 session token containing {id, username, role, name}
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const userPayload = JSON.parse(decodedStr);
    
    // Verify the user exists
    const user = db.getUserById(userPayload.id);
    if (!user || user.status === 'Inactive') {
      res.status(403).json({ error: 'User is inactive or deleted' });
      return;
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name
    };
    next();
  } catch (e) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check role middleware helper
const requireRole = (roles: ('Admin' | 'Receptionist' | 'Accountant')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Unauthorized: Access level insufficient' });
      return;
    }
    next();
  };
};

// --- API ENDPOINTS ---

// 1. Auth API
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const user = db.getUserByUsername(username);
  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (user.status === 'Inactive') {
    res.status(403).json({ error: 'Your account is deactivated' });
    return;
  }

  // Create base64 stateless session token
  const payload = { id: user.id, username: user.username, role: user.role, name: user.name };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');

  db.createAuditLog(user.id, user.username, 'Login', 'Successfully logged into the system.');

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      position: user.position,
      email: user.email,
      phone: user.phone
    }
  });
});

app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = db.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    position: user.position,
    email: user.email,
    phone: user.phone
  });
});

app.get('/api/auth/session', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = db.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      position: user.position,
      email: user.email,
      phone: user.phone
    }
  });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

// Forgot Password mock
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = db.getUsers().find(u => u.email === email);
  if (!user) {
    res.status(404).json({ error: 'No user registered with this email address' });
    return;
  }
  res.json({ message: `Reset instructions sent to ${email} (Demo: password is '${user.passwordHash}')` });
});

// 2. Dashboard Analytics
app.get('/api/dashboard/stats', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getDashboardStats());
});

// 3. Room Categories API
app.get('/api/categories', authenticateToken, (req, res) => {
  res.json(db.getCategories());
});

app.post('/api/categories', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const newCat = db.createCategory(req.body);
    db.createAuditLog(req.user!.id, req.user!.username, 'Create Category', `Created room category: ${newCat.name}`);
    res.status(201).json(newCat);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/categories/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Update Category', `Updated room category: ${updated.name}`);
  res.json(updated);
});

app.delete('/api/categories/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteCategory(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Delete Category', `Deleted category ID: ${req.params.id}`);
  res.json({ message: 'Category deleted successfully' });
});

// 4. Rooms API
app.get('/api/rooms', authenticateToken, (req, res) => {
  res.json(db.getRooms());
});

app.post('/api/rooms', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const room = db.createRoom(req.body);
    db.createAuditLog(req.user!.id, req.user!.username, 'Create Room', `Created Room ${room.roomNumber}`);
    res.status(201).json(room);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/rooms/:id', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateRoom(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Update Room', `Updated Room ${updated.roomNumber} - Status: ${updated.status}`);
  res.json(updated);
});

app.delete('/api/rooms/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteRoom(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Delete Room', `Deleted Room ID: ${req.params.id}`);
  res.json({ message: 'Room deleted successfully' });
});

// 5. Guests API
app.get('/api/guests', authenticateToken, (req, res) => {
  res.json(db.getGuests());
});

app.get('/api/guests/:id/history', authenticateToken, (req, res) => {
  const reservations = db.getReservations().filter(r => r.guestId === req.params.id);
  const invoices = db.getInvoices().filter(inv => reservations.some(res => res.id === inv.reservationId));
  const payments = db.getPayments().filter(pay => invoices.some(inv => inv.id === pay.invoiceId));
  res.json({ reservations, invoices, payments });
});

app.post('/api/guests', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const guest = db.createGuest(req.body);
    db.createAuditLog(req.user!.id, req.user!.username, 'Create Guest', `Registered guest ${guest.fullName}`);
    res.status(201).json(guest);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/guests/:id', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateGuest(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Guest not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Update Guest', `Updated guest profile: ${updated.fullName}`);
  res.json(updated);
});

app.delete('/api/guests/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteGuest(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Guest not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Delete Guest', `Deleted guest profile ID: ${req.params.id}`);
  res.json({ message: 'Guest profile deleted successfully' });
});

// 6. Reservations API
app.get('/api/reservations', authenticateToken, (req, res) => {
  res.json(db.getReservations());
});

app.post('/api/reservations', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const resv = db.createReservation(req.body);
    const guest = db.getGuestById(resv.guestId);
    db.createAuditLog(req.user!.id, req.user!.username, 'Create Reservation', `Created booking for guest ${guest?.fullName || 'unknown'}`);
    res.status(201).json(resv);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/reservations/:id', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateReservation(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Update Reservation', `Updated reservation status: ${updated.bookingStatus}`);
  res.json(updated);
});

app.delete('/api/reservations/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteReservation(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Reservation not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Delete Reservation', `Deleted reservation ID: ${req.params.id}`);
  res.json({ message: 'Reservation deleted successfully' });
});

// Check-In API
app.post('/api/reservations/:id/check-in', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  const { depositAmount, paymentMethod } = req.body;
  try {
    const result = db.checkInReservation(
      req.params.id, 
      Number(depositAmount || 0), 
      (paymentMethod || 'Cash') as PaymentMethod,
      req.user!.id,
      req.user!.username
    );
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Check-Out API
app.post('/api/reservations/:id/check-out', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  const { extraCharges, discountAmount } = req.body;
  try {
    const result = db.checkOutReservation(
      req.params.id, 
      Number(extraCharges || 0), 
      Number(discountAmount || 0),
      req.user!.id,
      req.user!.username
    );
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 7. Invoices & Billing API
app.get('/api/invoices', authenticateToken, (req, res) => {
  res.json(db.getInvoices());
});

app.get('/api/invoices/:id', authenticateToken, (req, res) => {
  const invoice = db.getInvoiceById(req.params.id);
  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  const items = db.getInvoiceItems(req.params.id);
  const payments = db.getPaymentsByInvoiceId(req.params.id);
  res.json({ invoice, items, payments });
});

// 8. Payments API
app.get('/api/payments', authenticateToken, (req, res) => {
  res.json(db.getPayments());
});

app.post('/api/payments', authenticateToken, requireRole(['Admin', 'Receptionist', 'Accountant']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const payment = db.createPayment(req.body);
    db.createAuditLog(req.user!.id, req.user!.username, 'Record Payment', `Recorded payment of ${db.getSettings().currency}${payment.amount} for invoice ${payment.invoiceId}`);
    res.status(201).json(payment);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POS Checkout API
app.post('/api/pos/checkout', authenticateToken, requireRole(['Admin', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  const { transactionType, items, reservationId, paymentMethod } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'At least one item is required for checkout' });
    return;
  }
  try {
    const result = db.processPOSCheckout(
      transactionType,
      items,
      reservationId,
      paymentMethod,
      req.user!.id,
      req.user!.username
    );
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 8.5 Expenses API
app.get('/api/expenses', authenticateToken, (req, res) => {
  res.json(db.getExpenses());
});

app.post('/api/expenses', authenticateToken, requireRole(['Admin', 'Accountant', 'Receptionist']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { description, amount, category, date, attachment, attachmentName } = req.body;
    if (!description || !amount || !category || !date) {
      res.status(400).json({ error: 'Description, amount, category, and date are required' });
      return;
    }
    const expense = db.createExpense({
      description,
      amount: Number(amount),
      category,
      date,
      recordedBy: req.user!.name,
      attachment,
      attachmentName
    });
    db.createAuditLog(req.user!.id, req.user!.username, 'Record Expense', `Recorded expense: ${description} (${db.getSettings().currency}${amount})`);
    res.status(201).json(expense);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/expenses/:id', authenticateToken, requireRole(['Admin', 'Accountant']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = db.deleteExpense(req.params.id);
    if (success) {
      db.createAuditLog(req.user!.id, req.user!.username, 'Delete Expense', `Deleted expense ID: ${req.params.id}`);
      res.json({ message: 'Expense deleted successfully' });
    } else {
      res.status(404).json({ error: 'Expense not found' });
    }
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// 8.6 Shift Handover API
app.get('/api/shift-handovers', authenticateToken, (req, res) => {
  res.json(db.getShiftHandovers());
});

app.post('/api/shift-handovers', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { toRole, notes, tasks } = req.body;
    if (!notes) {
      res.status(400).json({ error: 'General notes are required' });
      return;
    }
    const handover = db.createShiftHandover({
      fromUserId: req.user!.id,
      fromUserName: req.user!.name,
      fromUserRole: req.user!.role,
      toRole: toRole || 'All',
      notes,
      tasks: tasks || [],
      status: 'Active'
    });
    db.createAuditLog(
      req.user!.id,
      req.user!.username,
      'Create Shift Handover',
      `Created shift handover note targeting: ${toRole || 'All'}`
    );
    res.status(201).json(handover);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/shift-handovers/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updateShiftHandover(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Shift handover not found' });
      return;
    }
    db.createAuditLog(
      req.user!.id,
      req.user!.username,
      'Update Shift Handover',
      `Updated shift handover ID: ${req.params.id}`
    );
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/shift-handovers/:id/acknowledge', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.acknowledgeShiftHandover(req.params.id, req.user!.id);
    if (!updated) {
      res.status(404).json({ error: 'Shift handover not found' });
      return;
    }
    db.createAuditLog(
      req.user!.id,
      req.user!.username,
      'Acknowledge Shift Handover',
      `Acknowledged shift handover ID: ${req.params.id}`
    );
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});


// 9. Staff / User Management API
app.get('/api/staff', authenticateToken, requireRole(['Admin']), (req, res) => {
  res.json(db.getUsers());
});

app.post('/api/staff', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const newUser = db.createUser(req.body);
    db.createAuditLog(req.user!.id, req.user!.username, 'Create Staff', `Registered staff member ${newUser.name} with role ${newUser.role}`);
    res.status(201).json(newUser);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/staff/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateUser(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Update Staff', `Updated staff member: ${updated.name}`);
  res.json(updated);
});

app.delete('/api/staff/:id', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'You cannot delete your own account' });
    return;
  }
  const deleted = db.deleteUser(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }
  db.createAuditLog(req.user!.id, req.user!.username, 'Delete Staff', `Deleted staff member ID: ${req.params.id}`);
  res.json({ message: 'Staff member deleted successfully' });
});

// 10. Settings API
app.get('/api/public/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({
    hotelName: settings.hotelName,
    currencySymbol: settings.currency,
    address: settings.hotelAddress,
    phone: settings.hotelPhone,
    email: settings.hotelEmail,
    website: settings.website || ''
  });
});

app.get('/api/settings', authenticateToken, (req, res) => {
  const settings = db.getSettings();
  res.json({
    ...settings,
    hotelName: settings.hotelName,
    address: settings.hotelAddress,
    phone: settings.hotelPhone,
    email: settings.hotelEmail,
    website: settings.website || '',
    currencySymbol: settings.currency,
    vatTaxRate: (settings.taxRate || 0) * 100,
  });
});

app.put('/api/settings', authenticateToken, requireRole(['Admin']), (req: AuthenticatedRequest, res: Response) => {
  const { hotelName, address, phone, email, website, currencySymbol, vatTaxRate } = req.body;
  const updates: any = {};
  if (hotelName !== undefined) updates.hotelName = hotelName;
  if (address !== undefined) updates.hotelAddress = address;
  if (phone !== undefined) updates.hotelPhone = phone;
  if (email !== undefined) updates.hotelEmail = email;
  if (website !== undefined) updates.website = website;
  if (currencySymbol !== undefined) updates.currency = currencySymbol;
  if (vatTaxRate !== undefined) updates.taxRate = parseFloat(vatTaxRate) / 100;

  const updated = db.updateSettings(updates);
  db.createAuditLog(req.user!.id, req.user!.username, 'Update Settings', 'Updated hotel system settings.');
  
  res.json({
    ...updated,
    hotelName: updated.hotelName,
    address: updated.hotelAddress,
    phone: updated.hotelPhone,
    email: updated.hotelEmail,
    website: updated.website || '',
    currencySymbol: updated.currency,
    vatTaxRate: (updated.taxRate || 0) * 100,
  });
});

// 11. Audit Logs API
app.get('/api/audit-logs', authenticateToken, requireRole(['Admin']), (req, res) => {
  res.json(db.getAuditLogs());
});

// 12. Notifications API
app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json(db.getNotifications());
});

app.post('/api/notifications/read-all', authenticateToken, (req, res) => {
  db.markAllNotificationsAsRead();
  res.json({ success: true });
});

app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

// 13. Reports API (Interactive reports)
app.get('/api/reports', authenticateToken, requireRole(['Admin', 'Accountant']), (req, res) => {
  const { type, startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string).getTime() : 0;
  const end = endDate ? new Date(endDate as string).getTime() : Date.now();

  if (type === 'revenue') {
    // Financial transactions report
    const payments = db.getPayments().filter(p => {
      const time = new Date(p.paymentDate).getTime();
      return time >= start && time <= end;
    });
    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    // Expenses report
    const expenses = db.getExpenses().filter(e => {
      const time = new Date(e.date).getTime();
      return time >= start && time <= end;
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = total - totalExpenses;

    res.json({ 
      payments, 
      total, 
      expenses, 
      totalExpenses, 
      netProfit, 
      currency: db.getSettings().currency 
    });
  } else if (type === 'reservations') {
    // Bookings report
    const reservations = db.getReservations().filter(r => {
      const time = new Date(r.createdAt).getTime();
      return time >= start && time <= end;
    });
    res.json({ reservations, count: reservations.length });
  } else if (type === 'occupancy') {
    // Room usage stats
    const totalRooms = db.getRooms().length;
    const occupied = db.getRooms().filter(r => r.status === 'Occupied').length;
    const reserved = db.getRooms().filter(r => r.status === 'Reserved').length;
    const cleaning = db.getRooms().filter(r => r.status === 'Cleaning').length;
    const maintenance = db.getRooms().filter(r => r.status === 'Maintenance').length;
    res.json({
      totalRooms,
      occupied,
      reserved,
      cleaning,
      maintenance,
      rate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0
    });
  } else {
    res.status(400).json({ error: 'Invalid report type' });
  }
});

// 14. Global Search API
app.get('/api/search', authenticateToken, (req, res) => {
  const query = (req.query.q as string || '').toLowerCase();
  if (!query) {
    res.json({ guests: [], rooms: [], reservations: [] });
    return;
  }

  const guests = (db.getGuests() || []).filter(g => 
    (g.fullName || '').toLowerCase().includes(query) || 
    (g.phone || '').toLowerCase().includes(query) || 
    (g.email || '').toLowerCase().includes(query) ||
    (g.idNumber || '').toLowerCase().includes(query)
  ).slice(0, 5);

  const rooms = (db.getRooms() || []).filter(r => 
    (r.roomNumber || '').includes(query) || 
    (r.floor !== undefined ? r.floor.toString() : '') === query || 
    (r.status || '').toLowerCase().includes(query)
  ).slice(0, 5);

  const reservations = (db.getReservations() || []).filter(r => {
    const guest = r.guestId ? db.getGuestById(r.guestId) : null;
    return (
      (r.id || '').toLowerCase().includes(query) ||
      (guest && (guest.fullName || '').toLowerCase().includes(query)) ||
      ((r.rooms || []).some(rmId => (rmId || '').includes(query))) ||
      (r.bookingStatus || '').toLowerCase().includes(query)
    );
  }).slice(0, 5);

  res.json({ guests, rooms, reservations });
});


// --- VITE MIDDLEWARE FOR DEVELOPMENT AND PRODUCTION ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
