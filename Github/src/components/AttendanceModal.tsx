/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { SubClass, ClassSessionAttendance } from "../types";
import { X, Check } from "lucide-react";
import { formatIndonesianDate } from "../data/mockData";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subClass: SubClass;
  date: string;
  initialAttendance: ClassSessionAttendance | null;
  // Kept exact same onSave signature from App.tsx to ensure robust backwards-compatibility
  onSave: (
    classId: string,
    date: string,
    records: ClassSessionAttendance,
    filledStatus: { jamI: boolean; jamII: boolean; jamIII: boolean }
  ) => void;
}

export default function AttendanceModal({
  isOpen,
  onClose,
  subClass,
  date,
  initialAttendance,
  onSave
}: AttendanceModalProps) {
  
  // Decide if initially marked as "Sudah"
  const [internalSudah, setInternalSudah] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && initialAttendance) {
      // Find out if already filled on this date from the existing attendance states
      // If records or any filledStatus is present, mark as true
      const hasRecords = initialAttendance.jamI && initialAttendance.jamI.length > 0;
      setInternalSudah(hasRecords);
    } else {
      setInternalSudah(false);
    }
  }, [isOpen, initialAttendance]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Pack records properly to match old ClassSessionAttendance signature
    const emptyRecords: ClassSessionAttendance = {
      // Seed with student IDs if "Sudah", so that we preserve isSudah calculations
      jamI: internalSudah ? subClass.students.map(s => ({ studentId: s.id, status: "HADIR" })) : [],
      jamII: internalSudah ? subClass.students.map(s => ({ studentId: s.id, status: "HADIR" })) : [],
      jamIII: internalSudah ? subClass.students.map(s => ({ studentId: s.id, status: "HADIR" })) : []
    };

    onSave(
      subClass.id,
      date,
      emptyRecords,
      { jamI: internalSudah, jamII: internalSudah, jamIII: internalSudah }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Background Overlay */}
        <div 
          className="fixed inset-0 bg-slate-905/60 backdrop-blur-xs transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content area */}
        <div className="inline-block relative z-10 align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.12)] transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-slate-50/80 px-6.5 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Input Absensi Per-Kelas</span>
              <h3 className="text-md font-extrabold text-slate-900 mt-1 uppercase" id="modal-title">
                {subClass.fullName}
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="px-6.5 py-6 space-y-5">
            <div className="bg-indigo-50/50 rounded-2xl p-4.5 border border-indigo-100/30">
              <p className="text-xs text-indigo-900/85 leading-relaxed font-medium">
                Sesuai dengan pembaruan sistem kurikulum, input absensi sekarang diproses <strong>Per Kelas (Sudah / Belum)</strong> secara langsung per hari, bukan lagi memasukkan detail per-siswa.
              </p>
              <p className="text-[10px] text-indigo-500 font-bold mt-2 uppercase">
                Hari Terpilih: {formatIndonesianDate(date)}
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Pilih Status Absensi Kelas :</label>

              <div className="grid grid-cols-2 gap-4">
                {/* Option 1: SUDAH INPUT */}
                <button
                  type="button"
                  onClick={() => setInternalSudah(true)}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all text-center select-none cursor-pointer group ${
                    internalSudah
                      ? "bg-emerald-50/60 border-emerald-500 text-emerald-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    internalSudah ? "bg-emerald-500 text-white shadow-xs" : "bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-slate-100"
                  }`}>
                    <Check className="w-5 h-5 stroke-[3px]" />
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold">Sudah Input</span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">Sudah Mengajar & Absen</span>
                  </div>
                </button>

                {/* Option 2: BELUM INPUT */}
                <button
                  type="button"
                  onClick={() => setInternalSudah(false)}
                  className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2.5 transition-all text-center select-none cursor-pointer group ${
                    !internalSudah
                      ? "bg-rose-50/60 border-rose-500 text-rose-900 shadow-xs"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    !internalSudah ? "bg-rose-500 text-white shadow-xs" : "bg-slate-50 border border-slate-200 text-slate-400 group-hover:bg-slate-100"
                  }`}>
                    <X className="w-5 h-5 stroke-[3px]" />
                  </div>
                  <div>
                    <span className="block text-sm font-extrabold">Belum Input</span>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mt-0.5">Guru Belum Input Absen</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="bg-slate-50 px-6.5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 rounded-b-3xl">
            <button
              onClick={onClose}
              className="px-4.5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              Simpan Perubahan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
