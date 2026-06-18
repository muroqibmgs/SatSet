/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { SubClass, DailyAttendanceState, ClassSessionAttendance, ReminderLog, PendidikanJenjang } from "./types";
import { 
  classesList, 
  generateInitialState, 
  formatIndonesianDate, 
  getDayOfWeek 
} from "./data/mockData";
import { 
  Calendar, 
  CalendarOff,
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  XOctagon, 
  MessageSquare, 
  BarChart3, 
  RefreshCw, 
  Bell, 
  BookOpen, 
  Info,
  SlidersHorizontal,
  PlusCircle,
  Clock,
  ExternalLink,
  Download,
  FileText,
  Check,
  CheckSquare,
  Database
} from "lucide-react";
import StatCard from "./components/StatCard";
import ClassCard from "./components/ClassCard";
import AttendanceModal from "./components/AttendanceModal";
import ReminderModal from "./components/ReminderModal";
import TrendChart from "./components/TrendChart";
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  getSupabaseClient, 
  saveAttendanceToSupabase, 
  loadAttendanceFromSupabase,
  SUPABASE_STARTER_SQL,
  testSupabaseConnection
} from "./lib/supabase";
import AdminLogin from "./components/AdminLogin";

const STORAGE_KEY_STATE = "madrasah_attendance_state_v2";
const STORAGE_KEY_LOGS = "madrasah_reminder_logs_v2";

export default function App() {
  // ----- Core States -----
  const [attendanceData, setAttendanceData] = useState<DailyAttendanceState>({});
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("2026-06-06"); // Standard default Saturday June 6th 2026
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "analisis" | "reminderLogs" | "rekapEkspor">("dashboard");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Phone numbers mapping for each homeroom teacher (Wali Kelas)
  const [waliKelasPhones, setWaliKelasPhones] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("madrasah_wali_phones_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    const initialMap: Record<string, string> = {};
    classesList.forEach((cls, idx) => {
      // Generate realistic Indonesian mobile numbers (e.g. 0812-xxxx-xxxx)
      const prefixes = ["0812", "0813", "0821", "0822", "0852", "0853", "0878", "0896"];
      const prefix = prefixes[idx % prefixes.length];
      const middle = String(1000 + (idx * 17) % 9000);
      const end = String(2000 + (idx * 31) % 8000);
      initialMap[cls.id] = `${prefix}-${middle}-${end}`;
    });
    return initialMap;
  });

  // Derived class state with corresponding WA number
  const classesWithWa = useMemo(() => {
    return classesList.map((cls) => ({
      ...cls,
      waNumber: waliKelasPhones[cls.id] || ""
    }));
  }, [waliKelasPhones]);

  // ----- Admin & Supabase Configuration States -----
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("satset_admin_logged_in") === "true";
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem("satset_admin_email") || "";
  });
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState("");
  const [supabaseKeyInput, setSupabaseKeyInput] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeSupabaseConfig, setActiveSupabaseConfig] = useState<any>(() => {
    return getStoredSupabaseConfig();
  });

  // ----- Custom Range States (Monthly Report & Export) -----
  const [rangeStartDate, setRangeStartDate] = useState<string>("2026-06-01");
  const [rangeEndDate, setRangeEndDate] = useState<string>("2026-06-15");
  const [exportFilterJenjang, setExportFilterJenjang] = useState<PendidikanJenjang | "SEMUA">("SEMUA");
  const [exportFilterStatus, setExportFilterStatus] = useState<"SEMUA" | "LENGKAP" | "SEBAGIAN" | "BELUM_INPUT">("SEMUA");

  // ----- Filtering States -----
  const [filterJenjang, setFilterJenjang] = useState<PendidikanJenjang | "SEMUA">("SEMUA");
  const [filterStatus, setFilterStatus] = useState<"SEMUA" | "LENGKAP" | "SEBAGIAN" | "BELUM_INPUT">("SEMUA");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Check if today is Friday (school holiday)
  const isSelectedDateFriday = (() => {
    if (!selectedDate) return false;
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return false;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.getDay() === 5; // 5 is Friday
  })();

  // ----- Modal Orchestrators -----
  const [attendanceModalClass, setAttendanceModalClass] = useState<SubClass | null>(null);
  const [reminderModalClass, setReminderModalClass] = useState<SubClass | null>(null);
  const [unfilledJamsForReminder, setUnfilledJamsForReminder] = useState<string[]>([]);

  // ----- Toast States -----
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "warn" | "info">("success");

  // ----- Initialize application state from LocalStorage -----
  useEffect(() => {
    // 1. Attendance state
    const savedState = localStorage.getItem(STORAGE_KEY_STATE);
    if (savedState) {
      try {
        setAttendanceData(JSON.parse(savedState));
      } catch (e) {
        console.error("Error parsing attendance state.", e);
        const initial = generateInitialState();
        setAttendanceData(initial);
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(initial));
      }
    } else {
      const initial = generateInitialState();
      setAttendanceData(initial);
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(initial));
    }

    // 2. Reminder history logs
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    if (savedLogs) {
      try {
        setReminderLogs(JSON.parse(savedLogs));
      } catch (env) {
        setReminderLogs([]);
      }
    }

    // 3. Excluded Dates
    const savedExcluded = localStorage.getItem("madrasah_excluded_dates_v2");
    if (savedExcluded) {
      try {
        setExcludedDates(JSON.parse(savedExcluded));
      } catch (e) {
        setExcludedDates([]);
      }
    }
  }, []);

  // ----- Auth and Sync triggers -----
  const handleLoginSuccess = (email: string) => {
    setIsLoggedIn(true);
    setAdminEmail(email);
    localStorage.setItem("satset_admin_logged_in", "true");
    localStorage.setItem("satset_admin_email", email);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminEmail("");
    localStorage.removeItem("satset_admin_logged_in");
    localStorage.removeItem("satset_admin_email");
    showToast("Anda telah keluar dari sistem.", "info");

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  };

  // Listen to Supabase authorization shifts (such as Google OAuth logins)
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Check current active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email || "";
        if (email === "muroqibmgs@gmail.com") {
          handleLoginSuccess(email);
          showToast(`Sesi Google Aktif: Selamat datang ${email}!`, "success");
        } else {
          showToast(`Akses Ditolak: ${email} bukan email penanggung jawab.`, "warn");
          supabase.auth.signOut();
        }
      }
    });

    // Listen to real-time events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const email = session.user.email || "";
        if (email === "muroqibmgs@gmail.com") {
          handleLoginSuccess(email);
          if (event === "SIGNED_IN") {
            showToast(`Masuk sebagai Pengelola: ${email}!`, "success");
          }
        } else {
          showToast(`Akses Ditolak: ${email} bukan email penanggung jawab.`, "warn");
          supabase.auth.signOut();
        }
      } else if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setAdminEmail("");
        localStorage.removeItem("satset_admin_logged_in");
        localStorage.removeItem("satset_admin_email");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [activeSupabaseConfig]);

  const syncFromSupabaseCloud = async (silent = false) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      if (!silent) {
        showToast("Supabase belum dikonfigurasi. Menggunakan database lokal.", "info");
      }
      return;
    }

    if (!silent) {
      setIsSyncing(true);
    }
    
    try {
      const yearMonth = selectedDate.substring(0, 7); // e.g., "2026-06"
      const start = `${yearMonth}-01`;
      const year = parseInt(yearMonth.substring(0, 4), 10);
      const month = parseInt(yearMonth.substring(5, 7), 10);
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${yearMonth}-${String(lastDay).padStart(2, "0")}`;
      const cloudData = await loadAttendanceFromSupabase(start, end);

      if (cloudData && Object.keys(cloudData).length > 0) {
        setAttendanceData((prev) => {
          const merged = { ...prev };
          Object.keys(cloudData).forEach((dt) => {
            if (!merged[dt]) {
              merged[dt] = {};
            }
            merged[dt] = { ...merged[dt], ...cloudData[dt] };
          });
          localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(merged));
          return merged;
        });
        if (!silent) {
          showToast(`Sinkronisasi Supabase Sukses untuk ${yearMonth}!`, "success");
        }
      } else {
        if (!silent) {
          showToast("Tabel 'absensi' kosong atau belum memiliki rekaman di rentang ini.", "info");
        }
      }
    } catch (err: any) {
      console.warn("Manual sync error:", err);
      if (!silent) {
        showToast(`Sinkronisasi Gagal: ${err.message || err}`, "warn");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrlInput, supabaseKeyInput);
      setTestResult(res);
      if (res.success) {
        showToast("Koneksi Supabase sukses teruji!", "success");
      } else {
        showToast("Koneksi Supabase bermasalah, silakan periksa petunjuk.", "warn");
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || String(err)
      });
      showToast("Koneksi Supabase gagal terhubung.", "warn");
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Run automatically when selectedDate changes or login becomes active
  useEffect(() => {
    if (isLoggedIn) {
      syncFromSupabaseCloud(true);
    }
  }, [selectedDate, isLoggedIn]);

  // Helper trigger for Toast alerts
  const showToast = (message: string, type: "success" | "warn" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // ----- Helper to adjust date context -----
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);

    // If it is Friday, show notification and do not initialize/seed attendance data
    const parts = newDate.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (d.getDay() === 5) {
        showToast("Hari Jumat libur sekolah. Absensi ditiadakan.", "info");
        return;
      }
    }

    // If selectedDate does not exist yet in our JSON database state, dynamically seed it as empty
    setAttendanceData((prev) => {
      if (prev[newDate]) return prev;

      // Class initialization mapping
      const dateSeed: DailyAttendanceState[string] = {};
      classesWithWa.forEach((cls) => {
        dateSeed[cls.id] = {
          jamIFilled: false,
          jamIIFilled: false,
          jamIIIFilled: false,
          records: {
            jamI: cls.students.map(s => ({ studentId: s.id, status: "BELUM_INPUT" })),
            jamII: cls.students.map(s => ({ studentId: s.id, status: "BELUM_INPUT" })),
            jamIII: cls.students.map(s => ({ studentId: s.id, status: "BELUM_INPUT" }))
          },
          lastUpdated: new Date().toISOString()
        };
      });

      const updatedState = { ...prev, [newDate]: dateSeed };
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(updatedState));
      showToast(`Hari kerja baru diinisialisasi untuk tanggal ${formatIndonesianDate(newDate)}`, "info");
      return updatedState;
    });
  };

  // Navigate forward/back one day, skipping Fridays & manually excluded dates as schools are off
  const shiftDate = (direction: "prev" | "next") => {
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    let safety = 0;
    
    do {
      d.setDate(direction === "prev" ? d.getDate() - 1 : d.getDate() + 1);
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const isFriday = d.getDay() === 5;
      const isCustomExcluded = excludedDates.includes(formatted);
      if (!isFriday && !isCustomExcluded) {
        break;
      }
      safety++;
    } while (safety < 30);
    
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    handleDateChange(formatted);
  };

  // Toggle exclusion status of a specific date (Custom holiday/Ad-hoc non-school day)
  const toggleExcludeDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (d.getDay() === 5) {
        showToast("Hari Jumat secara otomatis adalah hari libur mingguan.", "info");
        return;
      }
    }

    setExcludedDates((prev) => {
      let updated: string[];
      if (prev.includes(dateStr)) {
        updated = prev.filter((d) => d !== dateStr);
        showToast(`Absensi untuk ${formatIndonesianDate(dateStr)} dibuka kembali.`, "success");
      } else {
        updated = [...prev, dateStr];
        showToast(`Absensi untuk ${formatIndonesianDate(dateStr)} dihapus & ditandai libur.`, "success");
      }
      localStorage.setItem("madrasah_excluded_dates_v2", JSON.stringify(updated));
      return updated;
    });
  };

  // Update a Wali Kelas's phone number
  const handleUpdateWaliPhone = (classId: string, phone: string) => {
    setWaliKelasPhones((prev) => {
      const updated = { ...prev, [classId]: phone };
      localStorage.setItem("madrasah_wali_phones_v2", JSON.stringify(updated));
      return updated;
    });
  };

  // ----- Interactive Input Actions -----
  const handleToggleClassStatus = (classId: string, isSudah: boolean) => {
    const cls = classesWithWa.find(c => c.id === classId);
    if (!cls) return;
    const emptyRecords: ClassSessionAttendance = {
      jamI: isSudah ? cls.students.map(s => ({ studentId: s.id, status: "HADIR" })) : [],
      jamII: isSudah ? cls.students.map(s => ({ studentId: s.id, status: "HADIR" })) : [],
      jamIII: isSudah ? cls.students.map(s => ({ studentId: s.id, status: "HADIR" })) : []
    };
    handleSaveAttendance(classId, selectedDate, emptyRecords, {
      jamI: isSudah,
      jamII: isSudah,
      jamIII: isSudah
    });
  };

  const handleSaveAttendance = async (
    classId: string,
    date: string,
    records: ClassSessionAttendance,
    filledStatus: { jamI: boolean; jamII: boolean; jamIII: boolean }
  ) => {
    setAttendanceData((prev) => {
      const updatedState = { ...prev };
      if (!updatedState[date]) updatedState[date] = {};

      updatedState[date][classId] = {
        jamIFilled: filledStatus.jamI,
        jamIIFilled: filledStatus.jamII,
        jamIIIFilled: filledStatus.jamIII,
        records: records,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(updatedState));
      return updatedState;
    });

    setAttendanceModalClass(null);
    showToast(`Absensi kelas ${classesWithWa.find(c => c.id === classId)?.fullName} berhasil disimpan secara lokal!`, "success");

    // Background push to Supabase
    const cls = classesWithWa.find(c => c.id === classId);
    if (cls) {
      try {
        const success = await saveAttendanceToSupabase(
          classId,
          date,
          cls.fullName,
          cls.waliKelas,
          cls.jenjang,
          filledStatus.jamI,
          filledStatus.jamII,
          filledStatus.jamIII,
          records
        );
        if (success) {
          showToast(`Berhasil disinkronkan ke cloud Supabase!`, "success");
        }
      } catch (err: any) {
        console.warn("Could not sync to Supabase: ", err);
        showToast("Tersimpan lokal. Supabase belum tersinkronisasi.", "warn");
      }
    }
  };

  const handleRegisterReminder = (
    classId: string,
    className: string,
    waliKelas: string,
    jams: string[]
  ) => {
    const newLog: ReminderLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      classId,
      className,
      waliKelas,
      date: selectedDate,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      jams,
      success: true
    };

    setReminderLogs((prev) => {
      const updatedLogs = [newLog, ...prev];
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
      return updatedLogs;
    });

    showToast(`Notifikasi pengingat ${className} direkam ke riwayat.`, "success");
  };

  // Clear all cached database states and reseed
  const handleResetData = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang (reset) data absensi ke pengaturan default awal? Semua edit manual Anda akan hilang.")) {
      const initial = generateInitialState();
      setAttendanceData(initial);
      setReminderLogs([]);
      setExcludedDates([]);
      localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(initial));
      localStorage.removeItem(STORAGE_KEY_LOGS);
      localStorage.removeItem("madrasah_excluded_dates_v2");
      setSelectedDate("2026-06-06");
      showToast("Seluruh database absensi harian berhasil disetel ulang ke kondisi default.", "info");
    }
  };

  // ----- Calculations / Mappers for Active Date -----
  const activeDateData = attendanceData[selectedDate] || {};

  // Compute stat statistics
  let countLengkap = 0;
  let countSebagian = 0;
  let countBelumInput = 0;

  // Gather specific list of classes matched with filled state
  const classStatusInfo = classesWithWa.map((cls) => {
    const dayState = activeDateData[cls.id];
    
    let status: "LENGKAP" | "SEBAGIAN" | "BELUM_INPUT" = "BELUM_INPUT";
    let j1 = false;
    let j2 = false;
    let j3 = false;
    let filledCount = 0;

    if (dayState) {
      j1 = dayState.jamIFilled;
      j2 = dayState.jamIIFilled;
      j3 = dayState.jamIIIFilled;
      
      if (j1) filledCount++;
      if (j2) filledCount++;
      if (j3) filledCount++;

      if (j1 && j2 && j3) {
        status = "LENGKAP";
        countLengkap++;
      } else if (j1 || j2 || j3) {
        status = "SEBAGIAN";
        countSebagian++;
      } else {
        status = "BELUM_INPUT";
        countBelumInput++;
      }
    } else {
      status = "BELUM_INPUT";
      countBelumInput++;
    }

    return {
      subClass: cls,
      j1,
      j2,
      j3,
      filledCount,
      status
    };
  });

  const totalClasses = classesWithWa.length;
  const completionRatePercent = totalClasses > 0 
    ? Math.round((countLengkap / totalClasses) * 100) 
    : 0;

  // Filter and search execution
  const filteredClasses = classStatusInfo.filter((info) => {
    // 1. Filter level (Jenjang)
    if (filterJenjang !== "SEMUA" && info.subClass.jenjang !== filterJenjang) return false;

    // 2. Filter status
    if (filterStatus !== "SEMUA" && info.status !== filterStatus) return false;

    // 3. Search query (Class Name or Teacher Name)
    if (searchQuery.trim() !== "") {
      const term = searchQuery.toLowerCase();
      const matchClass = info.subClass.fullName.toLowerCase().includes(term);
      const matchTeacher = info.subClass.waliKelas.toLowerCase().includes(term);
      if (!matchClass && !matchTeacher) return false;
    }

    return true;
  });

  if (!isLoggedIn) {
    return (
      <div className="relative">
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 text-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.08)] max-w-sm">
            <div className="flex-shrink-0">
              {toastType === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {toastType === "warn" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toastType === "info" && <Info className="w-5 h-5 text-sky-500" />}
            </div>
            <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
          </div>
        )}
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Dynamic Floating Toast Alerts */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 text-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.08)] max-w-sm">
          <div className="flex-shrink-0">
            {toastType === "success" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
            {toastType === "warn" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
            {toastType === "info" && <Info className="w-5 h-5 text-sky-500" />}
          </div>
          <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Primary Top Nav Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-35 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-xs md:shadow-indigo-600/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight leading-none text-slate-900 flex items-center gap-1">
                SatSet <span className="text-indigo-600 font-black">Pak</span>
              </h1>
              <p className="text-[9px] uppercase font-bold text-slate-400 mt-1 tracking-wider animate-pulse">
                Monitoring Absensi MGS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Nav Main tabs controls */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200/75 hover:bg-slate-100"
              }`}
            >
              Dashboard Status
            </button>
            <button
              onClick={() => setActiveTab("rekapEkspor")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all cursor-pointer ${
                activeTab === "rekapEkspor"
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200/75 hover:bg-slate-100"
              }`}
            >
              Filter Bulanan & Ekspor
            </button>
            <button
              onClick={() => setActiveTab("analisis")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all cursor-pointer ${
                activeTab === "analisis"
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200/75 hover:bg-slate-100"
              }`}
            >
              Grafik & Analisis
            </button>
            <button
              onClick={() => setActiveTab("reminderLogs")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-tight transition-all cursor-pointer relative ${
                activeTab === "reminderLogs"
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200/75 hover:bg-slate-100"
              }`}
            >
              Log WA Pengingat
              {reminderLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                  {reminderLogs.length}
                </span>
              )}
            </button>

            <span className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></span>

            {/* Supabase Dynamic Connection Trigger */}
            <button
              type="button"
              onClick={() => {
                const config = getStoredSupabaseConfig();
                setSupabaseUrlInput(config.url);
                setSupabaseKeyInput(config.anonKey);
                setTestResult(null);
                setShowSupabaseModal(true);
              }}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer flex items-center gap-1.5 border-2 ${
                getSupabaseClient() 
                  ? "bg-emerald-50 border-emerald-500 text-emerald-700 hover:bg-emerald-100/70"
                  : "bg-indigo-50 border-indigo-400 text-indigo-700 hover:bg-indigo-100/70 animate-pulse"
              }`}
              title="Hubungkan atau Konfigurasi Supabase Anda"
            >
              <Database className="w-3.5 h-3.5 shrink-0" />
              <span>Supabase {getSupabaseClient() ? "Aktif" : "Hubungkan"}</span>
            </button>

            {/* Manual Sync Cloud Trigger */}
            {getSupabaseClient() && (
              <button
                type="button"
                onClick={() => syncFromSupabaseCloud(false)}
                disabled={isSyncing}
                className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                title="Sinkronisasi Manual Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-600 font-bold" : ""}`} />
              </button>
            )}

            {/* Admin Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-2 bg-rose-50 border-rose-300 hover:bg-rose-100 text-rose-700 border rounded-xl text-[10px] font-black uppercase tracking-tight transition-all cursor-pointer"
              title="Keluar dari panel pengelola"
            >
              Keluar
            </button>

            <span className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></span>

            <button
              type="button"
              onClick={handleResetData}
              className="p-2 text-slate-400 hover:text-slate-650 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Reset data ke default"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

       {/* Upper Date Context Bar */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-50/50 text-indigo-600 rounded-xl border border-indigo-100/30">
              <Calendar className="w-4.5 h-4.5" />
            </span>
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Hari Pembelajaran Terpilih</span>
              <h2 className="text-lg font-extrabold text-slate-800 leading-none mt-1 flex items-center gap-2 flex-wrap">
                {formatIndonesianDate(selectedDate)}
                {excludedDates.includes(selectedDate) && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-rose-50 border border-rose-200 text-rose-700">Libur</span>
                )}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end">
            <div className="flex items-center gap-2.5 bg-slate-50/80 p-1.5 rounded-xl border border-slate-200/50">
              <button
                onClick={() => shiftDate("prev")}
                className="p-1.5 bg-white hover:bg-slate-100/80 rounded-lg text-slate-650 transition-all border border-slate-150 cursor-pointer shadow-xs"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Localized Inline Calendar Input */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
              />

              <button
                onClick={() => shiftDate("next")}
                className="p-1.5 bg-white hover:bg-slate-100/80 rounded-lg text-slate-650 transition-all border border-slate-150 cursor-pointer shadow-xs"
                title="Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Holiday Toggle */}
            {(!selectedDate.split("-").length || !(() => {
              const parts = selectedDate.split("-");
              if (parts.length !== 3) return false;
              const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              return d.getDay() === 5;
            })()) && (
              <button
                type="button"
                onClick={() => toggleExcludeDate(selectedDate)}
                className={`px-3 py-2 border rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5 ${
                  excludedDates.includes(selectedDate)
                    ? "bg-emerald-50 hover:bg-emerald-100/60 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 hover:bg-rose-100/60 text-rose-700 border-rose-200"
                }`}
                title={excludedDates.includes(selectedDate) ? "Buka kembali absensi hari ini" : "Tandandai hari ini sebagai libur & hapus absensi"}
              >
                <CalendarOff className="w-3.5 h-3.5 shrink-0" />
                <span>{excludedDates.includes(selectedDate) ? "Buka Absensi" : "Diliburkan"}</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dashboard Tab Content */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {isSelectedDateFriday ? (
              <div className="bg-gradient-to-br from-amber-50/65 to-orange-50/30 rounded-3xl border border-amber-100 p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs my-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 shadow-xs mb-2">
                  <CalendarOff className="w-8 h-8" />
                </div>
                <div className="space-y-2.5">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                    Hari Libur Madrasah
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                    Hari Jumat: Libur Sekolah
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
                    Madrasah MGS diliburkan setiap hari Jumat. Seluruh aktivitas absensi kelas, peninjauan absensi harian, dan pengiriman pesan pengingat (reminder) dinonaktifkan untuk hari ini.
                  </p>
                </div>
                <div className="border-t border-amber-100/70 pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => shiftDate("prev")}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Hari Sebelumnya
                  </button>
                  <button
                    onClick={() => shiftDate("next")}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-850 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Hari Berikutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : excludedDates.includes(selectedDate) ? (
              <div className="bg-gradient-to-br from-rose-50/65 to-red-50/30 rounded-3xl border border-rose-100 p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xs my-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 shadow-xs mb-2">
                  <CalendarOff className="w-8 h-8" />
                </div>
                <div className="space-y-2.5">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-rose-100 text-rose-850 border border-rose-200">
                    Hari Libur Khusus / Ad-Hoc
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-rose-900 tracking-tight">
                    Absensi Diliburkan / Dihapus
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
                    Hari ini ({formatIndonesianDate(selectedDate)}) telah ditandai sebagai hari libur khusus selain hari Jumat. Seluruh rekaman absensi hari ini dikecualikan dari semua laporan bulanan.
                  </p>
                </div>
                <div className="border-t border-rose-100/70 pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => toggleExcludeDate(selectedDate)}
                    className="w-full sm:w-auto px-4.5 py-2.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Buka Absensi Kembali
                  </button>
                  <button
                    onClick={() => shiftDate("prev")}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Hari Sebelumnya
                  </button>
                  <button
                    onClick={() => shiftDate("next")}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold bg-slate-900 text-white hover:bg-slate-850 rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    Hari Berikutnya
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Bento statistics row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Stat 1: Total Classes */}
              <StatCard
                title="Total Sub-Kelas"
                value={totalClasses}
                subtitle="MI / MTs / MA Terdaftar"
                icon={Users}
                colorType="primary"
                customContent={
                  <div className="flex gap-2 text-[10px] font-bold text-indigo-600 uppercase">
                    <span>{classesWithWa.filter(c => c.jenjang === "Ibtida'iyyah").length} MI</span>
                    <span>&bull;</span>
                    <span>{classesWithWa.filter(c => c.jenjang === "Tsanawiyyah").length} MTs</span>
                    <span>&bull;</span>
                    <span>{classesWithWa.filter(c => c.jenjang === "Aliyah").length} MA</span>
                  </div>
                }
              />

              {/* Stat 2: Sudah Input */}
              <StatCard
                title="Sudah Absen"
                value={countLengkap}
                subtitle="Selesai mengisi seluruh sesi"
                icon={CheckSquare}
                colorType="success"
                customContent={
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight flex items-center gap-1.5 mt-1">
                    <span>{countLengkap} Lengkap</span>
                    <span>&bull;</span>
                    <span className="text-amber-500">{countSebagian} Sebagian</span>
                  </div>
                }
              />

              {/* Stat 3: Belum Input */}
              <StatCard
                title="Belum Absen"
                value={countBelumInput}
                subtitle="Belum mengisi absensi harian"
                icon={XOctagon}
                colorType="danger"
                customContent={
                  countBelumInput > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-rose-600 font-extrabold animate-pulse">
                      ● Segera Diingatkan!
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase">
                      Lengkap 100%
                    </span>
                  )
                }
              />

              {/* Stat 4: Kepatuhan */}
              <StatCard
                title="Rasio Kehadiran"
                value={`${completionRatePercent}%`}
                subtitle="Persentase kepatuhan hari ini"
                icon={CheckCircle}
                colorType="primary"
                customContent={
                  <span className="text-[10px] bg-indigo-100 text-indigo-850 px-1.5 py-0.5 rounded-sm font-extrabold">
                    Target Hari Ini
                  </span>
                }
              />

            </div>

            {/* Main filters & control box */}
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5.5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] space-y-4.5">
              
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Cari kelas atau nama Wali Kelas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50/60 border border-slate-200/70 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all text-slate-800 font-semibold"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Grid vs List layout modes */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/30">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                      viewMode === "grid" 
                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/20" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    title="Tampilan Kotak (Grid)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
                      viewMode === "list" 
                        ? "bg-white text-indigo-600 shadow-xs border border-slate-200/20" 
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                    title="Tampilan Daftar (Table)"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                    Daftar
                  </button>
                </div>

              </div>

              {/* Selection Pills for Jenjang and Statuses */}
              <div className="flex flex-col lg:flex-row gap-4 justify-between border-t border-slate-100 pt-4">
                
                {/* Filter Jenjang Pendidikan */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1.5 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    Jenjang:
                  </span>
                  {(["SEMUA", "Ibtida'iyyah", "Tsanawiyyah", "Aliyah"] as const).map((jen) => {
                    const isActive = filterJenjang === jen;
                    return (
                      <button
                        key={jen}
                        onClick={() => setFilterJenjang(jen)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all cursor-pointer ${
                          isActive
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100/80"
                        }`}
                      >
                        {jen === "SEMUA" ? "Semua Jenjang" : jen}
                      </button>
                    );
                  })}
                </div>

                {/* Filter Progress Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1.5">
                    Status Input:
                  </span>
                  {(["SEMUA", "BELUM_INPUT", "SEBAGIAN", "LENGKAP"] as const).map((stat) => {
                    const statusLabel = {
                      SEMUA: "Semua Status",
                      BELUM_INPUT: "Belum Input",
                      SEBAGIAN: "Sebagian",
                      LENGKAP: "Lengkap"
                    }[stat];
                    const isActive = filterStatus === stat;

                    return (
                      <button
                        key={stat}
                        onClick={() => setFilterStatus(stat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-tight transition-all cursor-pointer ${
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-slate-100/80"
                        }`}
                      >
                        {statusLabel}
                      </button>
                    );
                  })}
                </div>

              </div>

            </div>

            {/* Rendering classes based on filters */}
            {filteredClasses.length > 0 ? (
              viewMode === "grid" ? (
                /* --- GRID VIEW --- */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClasses.map((info) => (
                    <ClassCard
                      key={info.subClass.id}
                      subClass={info.subClass}
                      isSudah={info.status === "LENGKAP"}
                      onToggleStatus={handleToggleClassStatus}
                      onOpenAttendance={(cls) => {
                        setAttendanceModalClass(cls);
                      }}
                      onSendReminder={(cls) => {
                        setReminderModalClass(cls);
                        setUnfilledJamsForReminder(["Sesi Utama"]);
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* --- LIST/TABLE VIEW --- */
                <div className="bg-white rounded-2xl border border-slate-200/50 overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                      <thead className="bg-slate-50/60 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                        <tr>
                          <th className="px-6 py-4.5 text-center w-16">NO.</th>
                          <th className="px-6 py-4.5 text-left">NAMA KELAS</th>
                          <th className="px-6 py-4.5 text-left">JENJANG</th>
                          <th className="px-6 py-4.5 text-left">WALI KELAS</th>
                          <th className="px-6 py-4.5 text-center w-32">SUDAH</th>
                          <th className="px-6 py-4.5 text-center w-32">BELUM</th>
                          <th className="px-6 py-4.5 text-center w-48">STATUS</th>
                          <th className="px-6 py-4.5 text-right pr-8">TINDAKAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-600 text-xs">
                        {filteredClasses.map((info, idx) => {
                          const isSudah = info.status === "LENGKAP";

                          // Stage specific badge styles
                          let stageBadgeClass = "bg-slate-50 text-slate-600 border-slate-200/60";
                          let stageLabel: string = info.subClass.jenjang;
                          if (info.subClass.jenjang === "Ibtida'iyyah") {
                            stageBadgeClass = "bg-teal-50 text-teal-700 border-teal-100/60 font-bold";
                            stageLabel = "MI";
                          } else if (info.subClass.jenjang === "Tsanawiyyah") {
                            stageBadgeClass = "bg-sky-50 text-sky-700 border-sky-100/60 font-bold";
                            stageLabel = "MTs";
                          } else if (info.subClass.jenjang === "Aliyah") {
                            stageBadgeClass = "bg-indigo-50 text-indigo-700 border-indigo-100/60 font-bold";
                            stageLabel = "MA";
                          }

                          return (
                            <tr key={info.subClass.id} className="hover:bg-slate-50/40 transition-colors">
                              <td className="px-6 py-4 text-center font-bold text-slate-300">
                                {idx + 1}
                              </td>
                              <td className="px-6 py-4 font-extrabold text-slate-800 uppercase">
                                {info.subClass.fullName}
                              </td>
                              <td className="px-6 py-4 font-semibold">
                                <span className={`inline-block px-2.5 py-0.5 rounded-lg border text-[9px] uppercase tracking-wider ${stageBadgeClass}`}>
                                  {stageLabel}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-slate-705">
                                <div>{info.subClass.waliKelas}</div>
                                {info.subClass.waNumber && (
                                  <div className="text-[10px] text-emerald-600 font-bold font-mono mt-0.5">
                                    WA: {info.subClass.waNumber}
                                  </div>
                                )}
                              </td>

                              {/* Centang column SUDAH */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleClassStatus(info.subClass.id, true)}
                                  className="inline-flex items-center justify-center p-1 cursor-pointer transition-all duration-150 hover:scale-110"
                                >
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    isSudah 
                                      ? "bg-emerald-500 border-emerald-600 text-white shadow-xs" 
                                      : "bg-slate-50 border-slate-250 text-transparent hover:border-slate-300"
                                  }`}>
                                    <Check className="w-4 h-4 text-white stroke-[3.5]" />
                                  </div>
                                </button>
                              </td>

                              {/* Centang column BELUM */}
                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleClassStatus(info.subClass.id, false)}
                                  className="inline-flex items-center justify-center p-1 cursor-pointer transition-all duration-150 hover:scale-110"
                                >
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    !isSudah 
                                      ? "bg-rose-500 border-rose-600 text-white shadow-xs" 
                                      : "bg-slate-50 border-slate-250 text-transparent hover:border-slate-300"
                                  }`}>
                                    <Check className="w-4 h-4 text-white stroke-[3.5]" />
                                  </div>
                                </button>
                              </td>

                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-bold text-[10px] border ${
                                  isSudah
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                    : "bg-rose-50 border-rose-100/70 text-rose-700"
                                }`}>
                                  ● {isSudah ? "Sudah Absen" : "Belum Input"}
                                </span>
                              </td>

                              <td className="px-6 py-4 text-right pr-8">
                                <div className="flex items-center justify-end gap-2.5">
                                  {!isSudah && (
                                    <button
                                      onClick={() => {
                                        setReminderModalClass(info.subClass);
                                        setUnfilledJamsForReminder(["Sesi Utama"]);
                                      }}
                                      className="p-1 px-2.5 text-xs text-emerald-705 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg transition-colors font-bold flex items-center gap-1 cursor-pointer"
                                      title="Kirim peringatan ke Guru Kelas via WhatsApp"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5 fill-emerald-600/10 text-emerald-600" />
                                      Ping WA
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setAttendanceModalClass(info.subClass)}
                                    className="p-1 px-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Input
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
                <h4 className="text-lg font-bold text-slate-800 mt-4">Kriteria Filter Tidak Ditemukan</h4>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Cobalah untuk mengubah kata kunci pencarian atau memilih filter status / jenjang pembelajaran yang berbeda.
                </p>
                <button
                  onClick={() => {
                    setFilterJenjang("SEMUA");
                    setFilterStatus("SEMUA");
                    setSearchQuery("");
                  }}
                  className="mt-5 inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-850 transition-colors shadow-sm cursor-pointer"
                >
                  Atur Ulang Filter
                </button>
              </div>
            )}
              </>
            )}

          </div>
        )}

        {/* Monthly Report & Export Tab Content */}
        {activeTab === "rekapEkspor" && (() => {
          // Calculate lists of dates in custom range
          const getDatesInRange = (startStr: string, endStr: string): string[] => {
            if (!startStr || !endStr) return [];
            try {
              const start = new Date(startStr);
              const end = new Date(endStr);
              const list: string[] = [];
              const current = new Date(start);
              let safetyCounter = 0;
              while (current <= end && safetyCounter < 100) {
                if (current.getDay() !== 5) { // 5 is Friday
                  const y = current.getFullYear();
                  const m = String(current.getMonth() + 1).padStart(2, "0");
                  const d = String(current.getDate()).padStart(2, "0");
                  const formatted = `${y}-${m}-${d}`;
                  if (!excludedDates.includes(formatted)) {
                    list.push(formatted);
                  }
                }
                current.setDate(current.getDate() + 1);
                safetyCounter++;
              }
              return list;
            } catch (err) {
              return [];
            }
          };

          const datesInRange = getDatesInRange(rangeStartDate, rangeEndDate);

          // Gather specific list of classes matched with filled status across selected dates
          const rekapRows: Array<{
            date: string;
            subClass: SubClass;
            statusType: "LENGKAP" | "SEBAGIAN" | "BELUM_INPUT";
            statusLabel: string;
          }> = [];

          datesInRange.forEach((date) => {
            const dayData = attendanceData[date] || {};
            classesWithWa.forEach((cls) => {
              if (exportFilterJenjang !== "SEMUA" && cls.jenjang !== exportFilterJenjang) return;

              const dayState = dayData[cls.id];
              let statusLabel = "Belum Input";
              let statusType: "LENGKAP" | "SEBAGIAN" | "BELUM_INPUT" = "BELUM_INPUT";

              if (dayState) {
                const { jamIFilled, jamIIFilled, jamIIIFilled } = dayState;
                if (jamIFilled && jamIIFilled && jamIIIFilled) {
                  statusLabel = "Lengkap";
                  statusType = "LENGKAP";
                } else if (jamIFilled || jamIIFilled || jamIIIFilled) {
                  statusLabel = "Sebagian";
                  statusType = "SEBAGIAN";
                }
              }

              if (exportFilterStatus !== "SEMUA" && statusType !== exportFilterStatus) return;

              rekapRows.push({
                date,
                subClass: cls,
                statusType,
                statusLabel
              });
            });
          });

          // Perform actual CSV Export of ringkasan
          const handleExportCSV = () => {
            try {
              let csvContent = "\uFEFF"; // Added standard UTF-8 BOM for Microsoft Excel compatibility
              csvContent += "TANGGAL,JENJANG,KELAS,WALI KELAS,STATUS ABSENSI\n";

              rekapRows.forEach((row) => {
                const fWali = row.subClass.waliKelas.replace(/"/g, '""');
                const fKelas = row.subClass.fullName.replace(/"/g, '""');

                csvContent += `"${row.date}","${row.subClass.jenjang}","${fKelas}","${fWali}","${row.statusLabel}"\n`;
              });

              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `SIMAB_Laporan_Ringkasan_${rangeStartDate}_s_d_${rangeEndDate}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast("Rangkuman absensi bulanan berhasil diekspor!", "success");
            } catch (err) {
              showToast("Kritikal: Gagal mengekspor kelas CSV", "warn");
            }
          };

          // Perform detailed student level CSV Export
          const handleExportDetailSiswaCSV = () => {
            try {
              let csvContent = "\uFEFF"; // BOM for Excel compatibility
              csvContent += "TANGGAL,JENJANG,KELAS,WALI KELAS,NAMA SISWA,NO ABSEN,JAM I,JAM II,JAM III\n";

              datesInRange.forEach((dt) => {
                const dayData = attendanceData[dt] || {};
                classesWithWa.forEach((cls) => {
                  if (exportFilterJenjang !== "SEMUA" && cls.jenjang !== exportFilterJenjang) return;

                  const dayState = dayData[cls.id];
                  let statusType: "LENGKAP" | "SEBAGIAN" | "BELUM_INPUT" = "BELUM_INPUT";

                  if (dayState) {
                    const { jamIFilled, jamIIFilled, jamIIIFilled } = dayState;
                    if (jamIFilled && jamIIFilled && jamIIIFilled) {
                      statusType = "LENGKAP";
                    } else if (jamIFilled || jamIIFilled || jamIIIFilled) {
                      statusType = "SEBAGIAN";
                    }
                  }

                  if (exportFilterStatus !== "SEMUA" && statusType !== exportFilterStatus) return;

                  cls.students.forEach((student) => {
                    const fWali = cls.waliKelas.replace(/"/g, '""');
                    const fKelas = cls.fullName.replace(/"/g, '""');
                    const fNama = student.nama.replace(/"/g, '""');

                    const sJamI = dayState?.records?.jamI?.find(r => r.studentId === student.id)?.status || "BELUM_INPUT";
                    const sJamII = dayState?.records?.jamII?.find(r => r.studentId === student.id)?.status || "BELUM_INPUT";
                    const sJamIII = dayState?.records?.jamIII?.find(r => r.studentId === student.id)?.status || "BELUM_INPUT";

                    csvContent += `"${dt}","${cls.jenjang}","${fKelas}","${fWali}","${fNama}",${student.absenNo},"${sJamI}","${sJamII}","${sJamIII}"\n`;
                  });
                });
              });

              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.setAttribute("href", url);
              link.setAttribute("download", `SIMAB_Detail_Siswa_${rangeStartDate}_s_d_${rangeEndDate}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              showToast("Rincian detail siswa bulanan berhasil diekspor!", "success");
            } catch (err) {
              showToast("Kritikal: Gagal mengekspor detail siswa CSV", "warn");
            }
          };

          return (
            <div className="space-y-6">
              
              {/* Report Header Card */}
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6.5 shadow-xs">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      Laporan Absensi & Ekspor Bulanan
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Filter status input dan jumlah siswa terabsen untuk seluruh kelas berdasarkan rentang hari pengamatan terstruktur.
                    </p>
                  </div>
                  
                  {/* Export buttons */}
                  <div className="flex flex-wrap gap-2.5 self-stretch lg:self-auto">
                    {getSupabaseClient() && (
                      <button
                        onClick={async () => {
                          setIsSyncing(true);
                          try {
                            const cloudData = await loadAttendanceFromSupabase(rangeStartDate, rangeEndDate);
                            if (cloudData && Object.keys(cloudData).length > 0) {
                              setAttendanceData((prev) => {
                                const merged = { ...prev };
                                Object.keys(cloudData).forEach((dt) => {
                                  if (!merged[dt]) merged[dt] = {};
                                  merged[dt] = { ...merged[dt], ...cloudData[dt] };
                                });
                                localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(merged));
                                return merged;
                              });
                              showToast(`Sukses sinkronisasi data cloud untuk rentang tanggal terpilih!`, "success");
                            } else {
                              showToast("Tidak ditemukan rekaman absensi cloud untuk rentang tanggal ini.", "info");
                            }
                          } catch (err: any) {
                            showToast(`Gagal sinkronisasi data cloud: ${err.message || err}`, "warn");
                          } finally {
                            setIsSyncing(false);
                          }
                        }}
                        disabled={isSyncing}
                        className="flex-1 lg:flex-none uppercase tracking-wider inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-slate-900 hover:bg-slate-800 font-bold text-[11px] text-white rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-white" : ""}`} />
                        Sinkronkan Range
                      </button>
                    )}
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 lg:flex-none uppercase tracking-wider inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-[11px] text-white rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Ekspor Ringkasan
                    </button>
                    <button
                      onClick={handleExportDetailSiswaCSV}
                      className="flex-1 lg:flex-none uppercase tracking-wider inline-flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-[11px] text-white rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Ekspor Detail Siswa
                    </button>
                  </div>
                </div>

                {/* Filter and selector row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border-t border-slate-100 mt-6 pt-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Mulai Pengamatan</label>
                    <input
                      type="date"
                      value={rangeStartDate}
                      onChange={(e) => setRangeStartDate(e.target.value)}
                      className="mt-2 block w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Selesai Pengamatan</label>
                    <input
                      type="date"
                      value={rangeEndDate}
                      onChange={(e) => setRangeEndDate(e.target.value)}
                      className="mt-2 block w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Jenjang Sekolah</label>
                    <select
                      value={exportFilterJenjang}
                      onChange={(e) => setExportFilterJenjang(e.target.value as any)}
                      className="mt-2 block w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs transition-colors"
                    >
                      <option value="SEMUA">Semua Jenjang (MI, MTs, MA)</option>
                      <option value="Ibtida'iyyah">Ibtida'iyyah (MI)</option>
                      <option value="Tsanawiyyah">Tsanawiyyah (MTs)</option>
                      <option value="Aliyah">Aliyah (MA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Status Absensi</label>
                    <select
                      value={exportFilterStatus}
                      onChange={(e) => setExportFilterStatus(e.target.value as any)}
                      className="mt-2 block w-full text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/50 px-3.5 py-2.5 border border-slate-250 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs transition-colors"
                    >
                      <option value="SEMUA">Semua Status (Lengkap / Sebagian / Belum)</option>
                      <option value="LENGKAP">Lengkap (Seluruh Sesi Terisi)</option>
                      <option value="SEBAGIAN">Sebagian (Baru Sesi Tertentu)</option>
                      <option value="BELUM_INPUT">Belum Input (Kosong Sama Sekali)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Custom Holiday Excluded Dates List */}
              {excludedDates.length > 0 && (
                <div className="bg-gradient-to-r from-rose-50/40 to-slate-50/30 border border-rose-100/70 rounded-2xl p-4.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl border border-rose-100/40 shrink-0">
                      <CalendarOff className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 tracking-tight">Daftar Hari Libur Khusus / Ad-Hoc Terdaftar</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Tanggal-tanggal ini telah dihapus dari perhitungan absensi, bagan tren analisis, dan ekspor laporan.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-w-full md:max-w-xl">
                    {excludedDates.map((d) => (
                      <div key={d} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-rose-100/80 rounded-lg text-[10px] font-bold text-rose-700 shadow-xs">
                        <span>{formatIndonesianDate(d)}</span>
                        <button
                          type="button"
                          onClick={() => toggleExcludeDate(d)}
                          className="w-4 h-4 rounded-full hover:bg-rose-100/50 flex items-center justify-center text-rose-450 hover:text-rose-600 cursor-pointer transition-colors"
                          title="Buka kembali absensi untuk hari ini"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="bg-white rounded-3xl border border-slate-200/50 overflow-hidden shadow-xs">
                <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    Menampilkan <span className="text-indigo-600 font-extrabold">{rekapRows.length} baris rekap harian</span> hasil filter.
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white border px-2.5 py-1 rounded-lg">
                    Preview Data Laporan
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-xs">
                      <tr>
                        <th className="px-6 py-3.5 text-center w-16">No</th>
                        <th className="px-6 py-3.5 text-left w-32">Tanggal</th>
                        <th className="px-6 py-3.5 text-left">Nama Kelas</th>
                        <th className="px-6 py-3.5 text-left">Wali Kelas</th>
                        <th className="px-6 py-3.5 text-center w-48">Status Absensi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-600 text-xs font-semibold">
                      {rekapRows.length > 0 ? (
                        rekapRows.map((row, idx) => (
                          <tr key={`${row.date}-${row.subClass.id}`} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-6 py-3.5 text-center font-bold text-slate-300">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-3.5 font-mono font-bold text-slate-500">
                              {row.date}
                            </td>
                            <td className="px-6 py-3.5 font-extrabold text-slate-800 uppercase">
                              {row.subClass.fullName}
                            </td>
                            <td className="px-6 py-3.5 font-semibold text-slate-500">
                              {row.subClass.waliKelas}
                            </td>

                            {/* Aggregated Status */}
                            <td className="px-6 py-3.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md font-bold text-[10px] border ${
                                row.statusType === "LENGKAP"
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : row.statusType === "SEBAGIAN"
                                  ? "bg-amber-50 border-amber-100 text-amber-700"
                                  : "bg-rose-50 border-rose-100/70 text-rose-700"
                              }`}>
                                ● {row.statusLabel}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            Tidak ada data rekapitulasi harian pada rentang waktu terpilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          );
        })()}

        {/* Analytics Trend Tab Content */}
        {activeTab === "analisis" && (
          <TrendChart 
            attendanceData={attendanceData} 
            classes={classesWithWa} 
            excludedDates={excludedDates}
          />
        )}

        {/* Reminder Logs Tab Content */}
        {activeTab === "reminderLogs" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Riwayat Pengingat WhatsApp</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Log lengkap pendistribusian alert notifikasi kepada Wali Kelas yang belum menginput absensi harian pada tanggal berjalan
                </p>
              </div>
              {reminderLogs.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm("Ingin menghapus seluruh log pengingat?")) {
                      setReminderLogs([]);
                      localStorage.removeItem(STORAGE_KEY_LOGS);
                      showToast("Log riwayat berhasil dibersihkan.", "info");
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all border border-rose-100 cursor-pointer"
                >
                  Hapus Semua Log
                </button>
              )}
            </div>

            {reminderLogs.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-500 tracking-wider font-bold">
                    <tr>
                      <th className="px-6 py-3.5 text-left">WAKTU ALERT</th>
                      <th className="px-6 py-3.5 text-left">NAMA SUB-KELAS</th>
                      <th className="px-6 py-3.5 text-left">WALI KELAS (PENERIMA)</th>
                      <th className="px-6 py-3.5 text-left">TANGGAL ABSENSI</th>
                      <th className="px-6 py-3.5 text-left">SESI MATAPELAJARAN</th>
                      <th className="px-6 py-3.5 text-center">STATUS PING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {reminderLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">
                          {log.timestamp}
                        </td>
                        <td className="px-6 py-4 font-black uppercase text-slate-800">
                          {log.className}
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-700">
                          {log.waliKelas}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatIndonesianDate(log.date)}
                        </td>
                        <td className="px-6 py-4 flex flex-wrap gap-1 items-center">
                          {log.jams.map((jm) => (
                            <span key={`${log.id}-${jm}`} className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm font-bold text-[9px]">
                              {jm}
                            </span>
                          ))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-100 text-[10px]">
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"></circle></svg>
                            Terkirim WA
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 mt-4">Belum Ada Notifikasi Dikirim</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Gunakan tombol <strong>Ping</strong> atau <strong>Kirim Pengingat</strong> di baris sub-kelas untuk mengingatkan pengajar melakukan entri absensi.
                </p>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer info brand */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-slate-500 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-400">
            SatSet Pak &copy; 2026. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-500/80">
            Didesain khusus untuk mempermudah Waka Kurikulum memantau ketertiban administrasi mengajar guru MGS (MI, MTs, dan MA).
          </p>
        </div>
      </footer>

      {/* --- RENDER MODALS ON CONDITION --- */}
      
      {/* Attendance edit modal */}
      {attendanceModalClass && (
        <AttendanceModal
          isOpen={!!attendanceModalClass}
          subClass={attendanceModalClass}
          date={selectedDate}
          initialAttendance={activeDateData[attendanceModalClass.id]?.records || null}
          onClose={() => setAttendanceModalClass(null)}
          onSave={handleSaveAttendance}
        />
      )}

      {/* Reminder compose modal */}
      {reminderModalClass && (
        <ReminderModal
          isOpen={!!reminderModalClass}
          subClass={reminderModalClass}
          date={selectedDate}
          unfilledJams={unfilledJamsForReminder}
          onClose={() => {
            setReminderModalClass(null);
            setUnfilledJamsForReminder([]);
          }}
          onConfirmSend={handleRegisterReminder}
          onUpdateWaNumber={handleUpdateWaliPhone}
        />
      )}

      {/* Supabase connection settings modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-3xl">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400 bg-white/10 p-1.5 rounded-lg border border-white/10 shrink-0" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Sambungan Database Supabase</h3>
                  <p className="text-[10px] text-slate-300">Hubungkan & simpan data absensi ke cloud database Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSupabaseModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-bold bg-white/10 p-1.5 px-2.5 rounded-xl border border-white/10"
              >
                Tutup
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 text-slate-700">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-xs">
                <span className="font-extrabold text-indigo-900 block mb-1">💡 Cara Kerja Integrasi Cloud:</span>
                <p className="text-slate-650 leading-relaxed font-semibold">
                  Aplikasi akan menyimpan data absensi ke tabel <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-100 font-bold font-mono">absensi</code> di database Supabase Anda setiap kali Anda melakukan update status absensi.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Supabase URL</label>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="misal: https://pbyzclnlyasdfgjklmno.supabase.co"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-505 transition-all placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="Kunci anonim umum (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-505 focus:border-indigo-505 transition-all placeholder:text-slate-300 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Live Connection Diagnostics */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnosis Koneksi</span>
                    <span className="text-[9px] text-slate-400 font-semibold">Uji kecocokan kredensial Anda langsung</span>
                  </div>
                  <button
                    type="button"
                    disabled={isTestingConnection}
                    onClick={handleTestConnection}
                    className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100/70 text-indigo-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {isTestingConnection ? "Sedang Menguji..." : "Uji Koneksi Supabase"}
                  </button>
                </div>
                {testResult && (
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed font-semibold transition-all ${
                    testResult.success 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : "bg-amber-50 border-amber-100 text-amber-800"
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-sm mt-0.5">{testResult.success ? "🟢" : "⚠️"}</span>
                      <div>
                        <span className="font-extrabold block mb-0.5">{testResult.success ? "Sambungan Aktif" : "Perlu Penyesuaian"}</span>
                        <span>{testResult.message}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Skrip Migrasi Tabel SQL</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_STARTER_SQL);
                      showToast("Skrip SQL berhasil disalin ke papan klip!", "success");
                    }}
                    className="text-[9px] font-black text-indigo-650 hover:text-indigo-850 hover:underline flex items-center gap-1 cursor-pointer bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg"
                  >
                    Salin Skrip SQL
                  </button>
                </div>
                <div className="relative">
                  <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono text-slate-500 overflow-x-auto max-h-[160px] leading-relaxed select-all">
                    {SUPABASE_STARTER_SQL}
                  </pre>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-100 flex flex-wrap gap-2.5 items-center justify-between bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => {
                  if (confirm("Hapus konfigurasi Supabase kustom?")) {
                    saveSupabaseConfig("", "");
                    setActiveSupabaseConfig({ url: "", anonKey: "" });
                    setSupabaseUrlInput("");
                    setSupabaseKeyInput("");
                    setShowSupabaseModal(false);
                    showToast("Sambungan Supabase dinonaktifkan. Mengalir ke penyimpanan lokal.", "info");
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
              >
                Hapus Sambungan
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSupabaseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    if (!supabaseUrlInput || !supabaseKeyInput) {
                      showToast("Kedua konfigurasi Supabase wajib terisi!", "warn");
                      return;
                    }
                    const url = supabaseUrlInput.trim();
                    const key = supabaseKeyInput.trim();
                    saveSupabaseConfig(url, key);
                    setActiveSupabaseConfig({ url, anonKey: key });
                    showToast("Kredensial Supabase disimpan!", "success");
                    setShowSupabaseModal(false);
                    await syncFromSupabaseCloud(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Simpan & Sinkronkan
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
