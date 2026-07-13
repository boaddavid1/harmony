/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { KeyRound, Mail, User, ShieldAlert, CheckCircle, Hotel, Sparkles } from 'lucide-react';
import { authApi } from '../api_client';
// @ts-ignore
import hotelCover from '../assets/images/hotel_login_cover_1783952570906.jpg';

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

  // Brand profile states
  const [hotelDetails, setHotelDetails] = useState<{
    hotelName: string;
    phone: string;
    email: string;
    address: string;
    website: string;
  } | null>(null);

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const data = await authApi.getPublicSettings();
        setHotelDetails(data);
      } catch (err) {
        console.error('Failed to fetch public hotel settings:', err);
      }
    };
    fetchPublicSettings();
  }, []);

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
    <div className="h-screen w-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* LEFT SIDE: Brand Cover, Logo & Hotel Name */}
      <div className="w-full h-[40%] md:h-full md:w-1/2 flex flex-col justify-between p-6 md:p-12 lg:p-16 text-white relative overflow-hidden bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800/60 shrink-0">
        
        {/* Dynamic Background Circles */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-900/15 blur-[120px] pointer-events-none z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-amber-900/10 blur-[120px] pointer-events-none z-10" />
        
        {/* High-Contrast Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20 z-10" />
        
        {/* Luxury Interior Background Image */}
        <img 
          src={hotelCover} 
          alt="Grand Horizon Lobby" 
          className="absolute inset-0 w-full h-full object-cover opacity-85 scale-105 transition-all duration-1000 z-0"
          referrerPolicy="no-referrer"
        />

        {/* Top Branding Header */}
        <div className="flex items-center gap-3 relative z-20">
          <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Hotel className="h-4 w-4 md:h-5 md:w-5 text-slate-950 stroke-[2]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] md:text-xs font-mono tracking-widest font-extrabold uppercase text-amber-400 truncate max-w-[200px]">
              {hotelDetails?.hotelName || 'Grand Horizon'}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-medium">
              {hotelDetails ? 'PMS Portal' : 'Resort & Spa'}
            </span>
          </div>
        </div>

        {/* Middle Welcome & Core Branding */}
        <div className="my-auto flex flex-col gap-2 md:gap-4 max-w-md relative z-20 pt-4 md:pt-8 pb-2 md:pb-4 text-left">
          <div className="flex items-center gap-2">
            <span className="h-[1px] w-4 md:w-6 bg-amber-400" />
            <span className="text-[10px] md:text-xs font-bold font-mono tracking-widest uppercase text-amber-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> PMS Portal
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-none text-white break-words max-w-full">
            {hotelDetails?.hotelName || 'Grand Horizon'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light line-clamp-3 md:line-clamp-none">
            Experience premium guest management, high-performance operational analytics, and integrated front-desk point of sale. Built for modern luxury hospitality teams.
          </p>
        </div>

        {/* Bottom System Info */}
        <div className="relative z-20 flex items-center gap-3 text-[10px] md:text-xs text-slate-500 font-mono">
          <span>v2.4.0 (Stable)</span>
          <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-amber-500/80" />
          <span>Front Desk & POS Active</span>
        </div>

      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full h-[60%] md:h-full md:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-slate-950 relative overflow-y-auto no-scrollbar">
        
        {/* Subtle Background Ambiance */}
        <div className="absolute top-[30%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-900/5 blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md flex flex-col gap-4 md:gap-6 lg:gap-8 relative z-10 py-4">
          
          {/* Welcome Message */}
          <div className="flex flex-col gap-1 md:gap-2">
            <h2 className="text-xl md:text-2xl font-extrabold text-white font-display tracking-tight">Staff Sign In</h2>
            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed">
              Authenticate using authorized credential keys to manage reservations, inventory, and billing.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-[11px] md:text-xs font-semibold flex items-center gap-2 animate-shake">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] md:text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="login_username_input"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter authorized username"
                  className="w-full pl-9 pr-4 py-2 md:py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] md:text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">Password</label>
                <button
                  type="button"
                  id="forgot_pwd_btn"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-all cursor-pointer font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  id="login_password_input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security key"
                  className="w-full pl-9 pr-4 py-2 md:py-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs md:text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login_submit_btn"
              disabled={isLoading}
              className="w-full py-2.5 md:py-3 mt-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[11px] md:text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? 'Decrypting Access...' : 'Sign In to Dashboard'}
            </button>
          </form>

          {/* Sandbox Credentials Guide */}
          <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex flex-col gap-2.5">
            <p className="text-[9px] font-extrabold font-mono tracking-wider uppercase text-slate-400">
              Demo Sandbox Profiles
            </p>
            <div className="grid grid-cols-1 gap-1.5 text-[10px] md:text-[11px]">
              <div className="flex justify-between items-center text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/40">
                <span>Admin: <strong className="text-slate-300 font-mono">admin</strong></span>
                <span>Pass: <strong className="text-slate-300 font-mono">admin123</strong></span>
              </div>
              <div className="flex justify-between items-center text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/40">
                <span>Reception: <strong className="text-slate-300 font-mono">receptionist</strong></span>
                <span>Pass: <strong className="text-slate-300 font-mono">reception123</strong></span>
              </div>
              <div className="flex justify-between items-center text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/40">
                <span>Accountant: <strong className="text-slate-300 font-mono">accountant</strong></span>
                <span>Pass: <strong className="text-slate-300 font-mono">accountant123</strong></span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-white font-mono uppercase tracking-widest">Recover Access</h3>
              <button 
                onClick={() => setShowForgot(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
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
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-xs font-medium text-emerald-200 leading-normal">
                  {forgotSuccess}
                </p>
                <button
                  onClick={() => setShowForgot(false)}
                  className="mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
                      className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-blue-900/20 cursor-pointer"
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
