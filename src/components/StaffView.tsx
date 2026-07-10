/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserSquare2, Plus, Edit2, Trash2, KeyRound, ShieldCheck, 
  X, RefreshCw, Mail, Phone, Lock
} from 'lucide-react';
import { User, UserRole } from '../types';
import { apiFetch } from '../api_client';

export default function StaffView() {
  const [staff, setStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // Fields
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Receptionist');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [errorMessage, setErrorMessage] = useState('');

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/staff');
      setStaff(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName('');
    setPosition('');
    setPhone('');
    setEmail('');
    setUsername('');
    setPassword('');
    setRole('Receptionist');
    setStatus('Active');
    setErrorMessage('');
    setShowModal(true);
  };

  const handleOpenEdit = (member: User) => {
    setEditingStaff(member);
    setName(member.name);
    setPosition(member.position);
    setPhone(member.phone);
    setEmail(member.email);
    setUsername(member.username);
    setPassword(member.passwordHash); // Demo: plain password text representation
    setRole(member.role);
    setStatus(member.status);
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const payload = {
      name,
      position,
      phone,
      email,
      username,
      passwordHash: password, // For demo plain password hashed
      role,
      status
    };

    try {
      if (editingStaff) {
        await apiFetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/staff', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while saving staff profile.');
    }
  };

  const handleDelete = async (member: User) => {
    if (!window.confirm(`Are you absolutely sure you want to remove staff member "${member.name}"?`)) return;
    try {
      await apiFetch(`/api/staff/${member.id}`, { method: 'DELETE' });
      fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Error deleting staff profile.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Querying staff registries...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6 no-scrollbar font-sans" id="staff_view_container">
      
      {/* Title block */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
            <UserSquare2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Staff registries</h2>
            <p className="text-xs text-slate-500 font-medium">Control system access, set accounts roles, and activate or deactivate user logins.</p>
          </div>
        </div>

        <button
          id="add_staff_btn"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff list cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
          <div key={member.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between gap-5 transition-all hover:shadow-md">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-display">{member.name}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{member.position}</p>
                </div>
                
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                  member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {member.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-500 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{member.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-mono">Username: <strong className="text-slate-700 font-semibold">{member.username}</strong></span>
                </div>
              </div>

              {/* Roles badge */}
              <div className="mt-4 flex">
                <span className="text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded border border-blue-100">
                  {member.role}
                </span>
              </div>
            </div>

            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => handleOpenEdit(member)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => handleDelete(member)}
                className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Staff Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">
                {editingStaff ? `Edit Staff Member: ${editingStaff.name}` : 'Add Staff Member'}
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Hotel Position</label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. Front Desk Receptionist"
                  className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Phone</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0102"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@hotel.com"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">System Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="sarah_reception"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">System Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password text"
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Security Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active Account</option>
                    <option value="Inactive">Deactivated Account</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs shadow-md mt-2 cursor-pointer"
              >
                {editingStaff ? 'Update Staff Credentials' : 'Register Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
