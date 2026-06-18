/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { Lock, Mail, Key, Sparkles, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      // Friendly helper if Supabase is not configured yet
      setErrorMsg(
        "Koneksi Supabase belum terpasang. Data absensi dan autentikasi Google berjalan optimal via Supabase. Silakan gunakan Hubungkan Supabase terlebih dahulu, atau masuk dengan Akun Google Admin secara manual di bawah."
      );
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setErrorMsg(`Gagal memulai masuk dengan Google: ${err.message || err}`);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!email || !password) {
      setErrorMsg("Email dan password wajib diisi!");
      setLoading(false);
      return;
    }

    // Try Supabase Auth first, if initialized
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          // Fallback to local default credential if it matches administrative Google account
          if (email === "muroqibmgs@gmail.com" && password === "admin123") {
            setSuccessMsg("Keamanan lokal tervalidasi. Menggunakan Akun Google Admin (Lokal).");
            setTimeout(() => {
              onLoginSuccess(email);
            }, 1000);
            return;
          }
          setErrorMsg(`Gagal login Supabase: ${error.message}`);
          setLoading(false);
          return;
        }

        if (data?.user) {
          if (data.user.email === "muroqibmgs@gmail.com") {
            setSuccessMsg(`Selamat datang, Pengelola ${data.user.email}! (Sesi Supabase aktif)`);
            setTimeout(() => {
              onLoginSuccess(data.user?.email || email);
            }, 1200);
          } else {
            setErrorMsg("Akses Ditolak: Akun Supabase Anda bukan pengelola MGS.");
            await supabase.auth.signOut();
            setLoading(false);
          }
          return;
        }
      } catch (err: any) {
        console.warn("Supabase auth error, falling back", err);
      }
    }

    // Default offline/standalone Admin authentication with the new Google Admin account
    if (email === "muroqibmgs@gmail.com" && password === "admin123") {
      setSuccessMsg("Login berhasil! Menggunakan Akun Google Admin (Standalone).");
      setTimeout(() => {
        onLoginSuccess(email);
      }, 1000);
    } else {
      setErrorMsg("Kredensial salah! Gunakan Email: muroqibmgs@gmail.com & Sandi: admin123");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4 flex items-center gap-1.5 opacity-60">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          MGS Attendance Portal v2.3
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-[0_32px_80px_rgba(0,0,0,0.06)] overflow-hidden"
      >
        <div className="p-8 pb-6 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-4">
            <Lock className="w-5 h-5 text-indigo-300" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">SatSet Pak Login</h2>
          <p className="text-xs text-slate-300/80 mt-1.5 leading-relaxed">
            Portal Waka Kurikulum Madrasah & Pesantren MGS.
          </p>
        </div>

        <div className="p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-start gap-2 text-xs">
              <CheckCircle className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Primary Google Login gateway */}
          <div className="space-y-2">
            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Gerbang Autentikasi Google
            </label>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-[0.98]"
            >
              <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.1z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>

          <div className="flex items-center">
            <div className="flex-1 border-t border-slate-100"></div>
            <span className="px-3 text-[9px] font-black tracking-widest text-slate-400 uppercase">
              Atau Akun Google Manual
            </span>
            <div className="flex-1 border-t border-slate-100"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Email Google Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="muroqibmgs@gmail.com"
                  className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Kata Sandi Standalone
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sandi admin Anda"
                  className="w-full pl-10.5 pr-10.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Menautkan Sesi..." : "Masuk Sistem Manual"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 block leading-relaxed font-semibold">
              Kredensial Default Admin MGS:
            </span>
            <code className="inline-block mt-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-600 font-mono text-center">
              Email: <span className="font-bold text-indigo-650">muroqibmgs@gmail.com</span>
              <br />
              Sandi: <span className="font-bold text-slate-800">admin123</span>
            </code>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

