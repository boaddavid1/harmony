/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, Mail, User, ShieldAlert, CheckCircle } from 'lucide-react';
import { authApi } from '../api_client';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authApi.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    try {
      const data = await authApi.forgotPassword(forgotEmail);
      setForgotSuccess(data.message);
    } catch (err: any) {
      setForgotError(err.message || 'Email not found.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Dynamic Background Circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 flex flex-col gap-8">
        
        {/* Branding Title */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-bold font-display tracking-tight text-white">
            Grand Horizon
          </h1>
          <p className="text-sm text-slate-400 font-medium leading-relaxed">
            Hotel Management System MVP
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 font-mono tracking-wider uppercase">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login_username_input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300 font-mono tracking-wider uppercase">Password</label>
              <button
                type="button"
                id="forgot_pwd_btn"
                onClick={() => {
                  setShowForgot(true);
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-all cursor-pointer font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="login_password_input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login_submit_btn"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Demo Credentials Helper (Extremely elegant, clear sandbox feedback) */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col gap-2.5">
          <p className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400">
            Sandbox Accounts
          </p>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between items-center text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/50">
              <span>Admin: <strong className="text-slate-200">admin</strong></span>
              <span>PW: <strong className="text-slate-200">admin123</strong></span>
            </div>
            <div className="flex justify-between items-center text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/50">
              <span>Receptionist: <strong className="text-slate-200">receptionist</strong></span>
              <span>PW: <strong className="text-slate-200">reception123</strong></span>
            </div>
            <div className="flex justify-between items-center text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/50">
              <span>Accountant: <strong className="text-slate-200">accountant</strong></span>
              <span>PW: <strong className="text-slate-200">accountant123</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wide">Recover Password</h3>
              <button 
                onClick={() => setShowForgot(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-xs font-semibold">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="flex flex-col gap-3 text-center py-4">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-medium text-emerald-200 leading-normal">
                  {forgotSuccess}
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered hotel email to instantly query your profile credentials.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="forgot_email_input"
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="admin@hotel.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-blue-900/20"
                >
                  Send Verification
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// Simple X icon replacement
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
