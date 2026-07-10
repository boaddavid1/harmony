/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  History, Search, RefreshCw, Terminal, Eye, X, Calendar, 
  ShieldAlert, User, ShieldCheck, HelpCircle
} from 'lucide-react';
import { AuditLog } from '../types';
import { apiFetch } from '../api_client';

export default function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected Log Modal for inspecting raw parameters
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/api/audit-logs');
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.performedBy.toLowerCase().includes(q) ||
      l.entityType.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-10">
        <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-500">Retrieving system security audit logs...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col gap-6 no-scrollbar font-sans" id="audit_view_container">
      
      {/* Title banner */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
            <History className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-slate-900">Activity Logs</h2>
            <p className="text-xs text-slate-500 font-medium">Observe chronological operation logs, track configuration shifts, and trace system entries.</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search filter panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="audit_search_input"
            type="text"
            placeholder="Search action, username, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase font-mono tracking-wider">
              <th className="p-4">Timestamp</th>
              <th className="p-4">User</th>
              <th className="p-4">Action Event</th>
              <th className="p-4">Target Entity</th>
              <th className="p-4">Machine Context</th>
              <th className="p-4 text-right">Raw</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400">
                  No activity logs posted matching search parameters.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => {
                const isAuthChange = log.action.includes('LOGIN') || log.action.includes('AUTH');
                const isDanger = log.action.includes('DELETE') || log.action.includes('CANCEL');

                return (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span>{log.performedBy}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isAuthChange ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        isDanger ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-600 font-semibold">{log.entityType}</span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ID: {log.entityId}</span>
                    </td>
                    <td className="p-4 text-slate-500 text-[11px] font-mono">
                      IP: {log.ipAddress}<br />
                      <span className="text-[10px] text-slate-400 truncate max-w-[150px] block" title={log.userAgent}>
                        {log.userAgent}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg cursor-pointer"
                        title="View raw state details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Raw log details inspect modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4.5 w-4.5 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wide">Inspect Action Payload</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px]">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Action:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Performed By:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.performedBy}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Target Entity:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.entityType}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Entity Reference:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedLog.entityId}</p>
                </div>
              </div>

              {/* JSON parameters view */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">Context Payload JSON</label>
                <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-auto max-h-60 no-scrollbar leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
