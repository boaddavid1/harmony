/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Clock, CheckSquare, Square, User, Plus, 
  Trash2, ClipboardList, CheckCircle2, AlertCircle, ThumbsUp, 
  Check, FileText, Send, RefreshCw, UserCheck, Calendar
} from 'lucide-react';
import { ShiftHandover, HandoverTask, UserRole, User as UserType } from '../types';
import { shiftHandoverApi } from '../api_client';

interface ShiftHandoverViewProps {
  user: UserType;
  currency: string;
}

export default function ShiftHandoverView({ user, currency }: ShiftHandoverViewProps) {
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating a new handover
  const [notes, setNotes] = useState('');
  const [toRole, setToRole] = useState<'All' | UserRole>('All');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [formTasks, setFormTasks] = useState<{ description: string; status: 'Pending' | 'In Progress' | 'Completed' }[]>([]);

  // Filtering states
  const [selectedHandoverId, setSelectedHandoverId] = useState<string | null>(null);

  const fetchHandovers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await shiftHandoverApi.list();
      // Sort handovers by date descending
      const sorted = (data || []).sort(
        (a: ShiftHandover, b: ShiftHandover) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHandovers(sorted);
      if (sorted.length > 0 && !selectedHandoverId) {
        setSelectedHandoverId(sorted[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shift handovers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, []);

  const handleAddTaskToForm = () => {
    if (!newTaskDesc.trim()) return;
    setFormTasks([...formTasks, { description: newTaskDesc.trim(), status: 'Pending' }]);
    setNewTaskDesc('');
  };

  const handleRemoveTaskFromForm = (idx: number) => {
    setFormTasks(formTasks.filter((_, i) => i !== idx));
  };

  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please add handover notes.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const newHandover = await shiftHandoverApi.create({
        toRole,
        notes: notes.trim(),
        tasks: formTasks
      });
      setSuccess('Shift handover log submitted successfully.');
      setNotes('');
      setToRole('All');
      setFormTasks([]);
      
      // Refresh list and select new handover
      const data = await shiftHandoverApi.list();
      const sorted = (data || []).sort(
        (a: ShiftHandover, b: ShiftHandover) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHandovers(sorted);
      setSelectedHandoverId(newHandover.id);
    } catch (err: any) {
      setError(err.message || 'Failed to submit shift handover.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskStatus = async (handoverId: string, taskId: string, currentStatus: string) => {
    const handover = handovers.find(h => h.id === handoverId);
    if (!handover) return;

    const nextStatus = currentStatus === 'Completed' ? 'Pending' : currentStatus === 'Pending' ? 'In Progress' : 'Completed';
    const updatedTasks = handover.tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t);

    try {
      const updatedHandover = await shiftHandoverApi.update(handoverId, { tasks: updatedTasks });
      setHandovers(handovers.map(h => h.id === handoverId ? updatedHandover : h));
    } catch (err: any) {
      setError(err.message || 'Failed to update task status.');
    }
  };

  const handleUpdateHandoverStatus = async (handoverId: string, status: 'Active' | 'Completed') => {
    try {
      const updatedHandover = await shiftHandoverApi.update(handoverId, { status });
      setHandovers(handovers.map(h => h.id === handoverId ? updatedHandover : h));
      setSuccess(`Handover marked as ${status.toLowerCase()}.`);
    } catch (err: any) {
      setError(err.message || 'Failed to update handover status.');
    }
  };

  const handleAcknowledge = async (handoverId: string) => {
    try {
      const updatedHandover = await shiftHandoverApi.acknowledge(handoverId);
      setHandovers(handovers.map(h => h.id === handoverId ? updatedHandover : h));
      setSuccess('Handover acknowledged successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to acknowledge handover.');
    }
  };

  const selectedHandover = handovers.find(h => h.id === selectedHandoverId);

  // Check if current user has an unacknowledged active handover targeting their role or "All"
  const unacknowledgedHandovers = handovers.filter(
    h => h.status === 'Active' && 
         h.fromUserId !== user.id &&
         (h.toRole === 'All' || h.toRole === user.role) && 
         !h.acknowledgedBy.includes(user.id)
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Top Notification Banner for unacknowledged handovers */}
      {unacknowledgedHandovers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border-b border-amber-500/30 px-6 py-3.5 flex items-center justify-between gap-4 animate-pulse shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300 font-mono uppercase tracking-wider">Shift Handover Acknowledging Required</h4>
              <p className="text-[11px] text-slate-400">
                You have <strong className="text-amber-200">{unacknowledgedHandovers.length}</strong> active shift handover(s) waiting for your review and acknowledgment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedHandoverId(unacknowledgedHandovers[0].id)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs tracking-wider transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* LEFT PANEL: Handover Directory (List of Shift Logs) */}
        <div className="w-full lg:w-96 border-r border-slate-800 flex flex-col min-h-0 shrink-0">
          
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">Shift Handover Logs</h2>
            </div>
            <button 
              onClick={fetchHandovers} 
              disabled={isLoading}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>

          {/* Quick Info & Stats */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 text-[10px] grid grid-cols-2 gap-2 font-mono">
            <div className="bg-slate-950/40 p-2 rounded border border-slate-800 text-center">
              <span className="text-slate-500 block uppercase">Active</span>
              <span className="text-xs font-bold text-blue-400">{handovers.filter(h => h.status === 'Active').length} Logged</span>
            </div>
            <div className="bg-slate-950/40 p-2 rounded border border-slate-800 text-center">
              <span className="text-slate-500 block uppercase">Acknowledged</span>
              <span className="text-xs font-bold text-emerald-400">
                {handovers.filter(h => h.acknowledgedBy.includes(user.id)).length} Completed
              </span>
            </div>
          </div>

          {/* Handover List Container */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar bg-slate-950/20">
            {handovers.length === 0 ? (
              <div className="text-center py-12 px-4 flex flex-col gap-2">
                <FileText className="h-8 w-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500">No shift handover records found. Use the form on the right to log a new one.</p>
              </div>
            ) : (
              handovers.map((h) => {
                const totalTasks = h.tasks.length;
                const completedTasks = h.tasks.filter(t => t.status === 'Completed').length;
                const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                const isSelected = h.id === selectedHandoverId;
                const isAcknowledged = h.acknowledgedBy.includes(user.id);
                const isTargeted = h.toRole === 'All' || h.toRole === user.role;

                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHandoverId(h.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex flex-col gap-2 cursor-pointer ${
                      isSelected 
                        ? 'bg-slate-800 border-slate-700 shadow-lg shadow-slate-950/40' 
                        : 'bg-slate-900 hover:bg-slate-800/50 border-slate-800/80 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 w-full">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 text-[10px] font-bold text-slate-300">
                          {h.fromUserName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-200 truncate block">{h.fromUserName}</span>
                          <span className="text-[9px] text-slate-500 font-mono uppercase block">{h.fromUserRole}</span>
                        </div>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center gap-1 shrink-0">
                        {h.status === 'Active' ? (
                          <span className="text-[8px] font-bold font-mono tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-[8px] font-bold font-mono tracking-wider uppercase bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded">
                            Archived
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {h.notes}
                    </p>

                    {/* Progress & Metadata */}
                    <div className="border-t border-slate-800/60 pt-2.5 mt-1 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {totalTasks > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] ${completionPct === 100 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                          {completedTasks}/{totalTasks} Tasks ({completionPct}%)
                        </span>
                      )}
                    </div>

                    {/* Target and Acknowledgement Overlay */}
                    <div className="flex items-center justify-between mt-1 text-[9px] font-semibold">
                      <span className="text-slate-500">
                        To: <strong className="text-amber-500 font-mono uppercase">{h.toRole}</strong>
                      </span>
                      {isAcknowledged ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-mono uppercase">
                          <Check className="h-2.5 w-2.5 stroke-[3]" /> Acknowledged
                        </span>
                      ) : (
                        isTargeted && h.fromUserId !== user.id && (
                          <span className="text-amber-400 font-mono uppercase flex items-center gap-1">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0" /> Unacknowledged
                          </span>
                        )
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* MIDDLE / DETAILED PREVIEW VIEW */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-slate-800 bg-slate-900/40">
          
          {selectedHandover ? (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Detailed View Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/30 flex flex-col gap-4 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-extrabold text-lg">
                      {selectedHandover.fromUserName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{selectedHandover.fromUserName}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono uppercase bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                          {selectedHandover.fromUserRole}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span>Logged at {new Date(selectedHandover.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Top Header Actions */}
                  <div className="flex items-center gap-2">
                    {selectedHandover.fromUserId === user.id ? (
                      <div className="flex items-center gap-2">
                        {selectedHandover.status === 'Active' ? (
                          <button
                            onClick={() => handleUpdateHandoverStatus(selectedHandover.id, 'Completed')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Archive Log
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateHandoverStatus(selectedHandover.id, 'Active')}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Make Active
                          </button>
                        )}
                      </div>
                    ) : (
                      !selectedHandover.acknowledgedBy.includes(user.id) && (
                        <button
                          onClick={() => handleAcknowledge(selectedHandover.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs tracking-wider transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" /> Acknowledge Handover
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Scope Summary Alert Badge */}
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400">
                  <div>
                    <span className="text-slate-500">Intended Audience:</span>{' '}
                    <strong className="text-amber-400 font-mono uppercase text-[11px]">{selectedHandover.toRole}</strong>
                  </div>
                  <div className="hidden sm:block text-slate-700">|</div>
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <strong className={`font-mono uppercase text-[11px] ${selectedHandover.status === 'Active' ? 'text-blue-400' : 'text-slate-500'}`}>
                      {selectedHandover.status}
                    </strong>
                  </div>
                  <div className="hidden sm:block text-slate-700">|</div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                    <span>Acknowledged by {selectedHandover.acknowledgedBy.length} staff</span>
                  </div>
                </div>
              </div>

              {/* Scrollable Handover Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                
                {/* General Notes Card */}
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-blue-400" /> Handover Notes & Instructions
                  </h4>
                  <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedHandover.notes}
                  </div>
                </div>

                {/* Handover Checkoff List */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <ClipboardCheck className="h-3.5 w-3.5 text-blue-400" /> Action Checklist & Task Progress
                    </span>
                    <span className="text-[10px] text-slate-500 normal-case font-normal">
                      Click task checkboxes to toggle progress states
                    </span>
                  </h4>

                  {selectedHandover.tasks.length === 0 ? (
                    <div className="p-4 bg-slate-900/40 border border-slate-800/80 border-dashed rounded-xl text-center text-xs text-slate-500">
                      No structured tasks were appended to this handover.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {selectedHandover.tasks.map((task) => {
                        let statusColor = 'border-slate-800 bg-slate-950/40 text-slate-400';
                        if (task.status === 'In Progress') {
                          statusColor = 'border-blue-900/50 bg-blue-950/10 text-blue-300';
                        } else if (task.status === 'Completed') {
                          statusColor = 'border-emerald-900/50 bg-emerald-950/10 text-emerald-300';
                        }

                        return (
                          <div 
                            key={task.id}
                            onClick={() => handleToggleTaskStatus(selectedHandover.id, task.id, task.status)}
                            className={`p-3.5 rounded-xl border flex items-center gap-3.5 justify-between transition-all hover:bg-slate-800/40 cursor-pointer select-none ${statusColor}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0 mt-0.5">
                                {task.status === 'Completed' ? (
                                  <CheckSquare className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
                                ) : task.status === 'In Progress' ? (
                                  <div className="h-5 w-5 rounded border border-blue-500 flex items-center justify-center">
                                    <div className="h-2.5 w-2.5 bg-blue-500 rounded-xs animate-pulse" />
                                  </div>
                                ) : (
                                  <Square className="h-5 w-5 text-slate-500 stroke-[2]" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className={`text-xs font-semibold block ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                  {task.description}
                                </span>
                              </div>
                            </div>

                            <span className="text-[9px] font-mono font-bold uppercase shrink-0 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {task.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Acknowledgements Section */}
                <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/60">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-400" /> Staff Acknowledgements ({selectedHandover.acknowledgedBy.length})
                  </h4>

                  {selectedHandover.acknowledgedBy.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No incoming staff have acknowledged this shift handover yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedHandover.acknowledgedBy.map((userId) => (
                        <div 
                          key={userId}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-300"
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[3]" />
                          <span>Staff User ID: <strong className="font-mono text-slate-400 font-semibold">{userId}</strong></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center gap-3">
              <ClipboardList className="h-12 w-12 text-slate-800" />
              <h3 className="text-sm font-bold text-slate-400 font-mono uppercase">No Handover Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm">Select a shift handover log from the directory, or create a brand new one using the form on the right.</p>
            </div>
          )}

        </div>

        {/* RIGHT PANEL: Create New Handover Log Form */}
        <div className="w-full lg:w-[420px] bg-slate-950/40 p-6 flex flex-col min-h-0 shrink-0 overflow-y-auto border-t lg:border-t-0 border-slate-800 no-scrollbar">
          
          <div className="flex items-center gap-2 mb-6">
            <Send className="h-4 w-4 text-blue-400" />
            <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">Log New Handover</h2>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmitHandover} className="flex flex-col gap-5">
            
            {/* Target Role Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Intended Recipient Role</label>
              <select
                value={toRole}
                onChange={(e) => setToRole(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Roles (Broadcast)</option>
                <option value="Receptionist">Receptionist Only</option>
                <option value="Accountant">Accountant Only</option>
                <option value="Admin">Administrator Only</option>
              </select>
            </div>

            {/* General Notes Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Shift Notes & Instructions</label>
              <textarea
                required
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log notes about physical cash status, specific room updates, ongoing issues, VIP requests..."
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium leading-relaxed resize-none"
              />
            </div>

            {/* Checklists and Tasks */}
            <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-4">
              <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Append Structured Check-Off Tasks</label>
              
              {/* Add Task Input line */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Task (e.g. Balance front drawer cash)"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTaskToForm();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddTaskToForm}
                  className="px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Added Tasks Listing */}
              {formTasks.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 max-h-36 overflow-y-auto no-scrollbar">
                  {formTasks.map((t, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs"
                    >
                      <span className="text-slate-200 truncate pr-3">{t.description}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTaskFromForm(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Send className="h-3.5 w-3.5" /> Log & Broadcast Handover
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}
