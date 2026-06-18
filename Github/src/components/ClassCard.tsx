/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SubClass } from "../types";
import { CheckCircle2, AlertTriangle, Bell, Check } from "lucide-react";
import { motion } from "motion/react";

interface ClassCardProps {
  key?: string | number;
  subClass: SubClass;
  isSudah: boolean;
  onToggleStatus: (classId: string, isSudah: boolean) => void;
  onOpenAttendance: (subClass: SubClass) => void;
  onSendReminder: (subClass: SubClass) => void;
}

export default function ClassCard({
  subClass,
  isSudah,
  onToggleStatus,
  onOpenAttendance,
  onSendReminder
}: ClassCardProps) {
  
  let statusText = isSudah ? "Sudah Input" : "Belum Input";
  let statusClass = isSudah 
    ? "bg-emerald-50 text-emerald-700 border-emerald-100/70" 
    : "bg-rose-50 text-rose-700 border-rose-100/70";
  let statusIcon = isSudah 
    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 
    : <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;

  // Determine border and base background matching the status
  const cardStyleClass = isSudah 
    ? "border-slate-100 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:border-emerald-200/80 hover:shadow-[0_8px_30px_rgba(16,185,129,0.04)]" 
    : "border-rose-100/70 bg-white shadow-[0_4px_20px_-4px_rgba(190,24,74,0.02)] hover:border-rose-300 hover:shadow-[0_8px_30px_rgba(239,68,68,0.04)]";

  // Customize tag badges by Level (MI, MTs, MA)
  let levelTagClass = "bg-slate-50 text-slate-600 border-slate-200";
  let levelLabel: string = subClass.jenjang;
  if (subClass.jenjang === "Ibtida'iyyah") {
    levelTagClass = "bg-teal-50 text-teal-700 border-teal-100/80 font-bold";
    levelLabel = "Ibtida'iyyah (MI)";
  } else if (subClass.jenjang === "Tsanawiyyah") {
    levelTagClass = "bg-sky-50 text-sky-700 border-sky-100/80 font-bold";
    levelLabel = "Tsanawiyyah (MTs)";
  } else if (subClass.jenjang === "Aliyah") {
    levelTagClass = "bg-indigo-50 text-indigo-700 border-indigo-100/80 font-bold";
    levelLabel = "Aliyah (MA)";
  }

  return (
    <motion.div
      layout
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      className={`rounded-2xl border p-5.5 transition-all duration-300 flex flex-col justify-between h-52 ${cardStyleClass}`}
    >
      <div>
        {/* Header containing level indicator & status pill */}
        <div className="flex items-start justify-between">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${levelTagClass}`}>
            {levelLabel}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${statusClass}`}>
            {statusIcon}
            {statusText}
          </span>
        </div>

        {/* Class name & wali kelas info */}
        <div className="mt-4">
          <h4 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none uppercase">
            {subClass.fullName}
          </h4>
          <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Wali Kelas: <span className="font-semibold text-slate-700">{subClass.waliKelas}</span>
          </p>
        </div>
      </div>

      {/* Grid status of individual hourly periods changed to simple checklist Centang: Sudah / Belum */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-50 pt-4">
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Input Absen:</label>
          
          <div className="flex items-center gap-2">
            {/* Checkbox Sudah */}
            <button
              type="button"
              onClick={() => onToggleStatus(subClass.id, true)}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all select-none cursor-pointer ${
                isSudah
                  ? "bg-emerald-500 border-emerald-600 text-white shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center transition-colors ${
                isSudah ? "bg-white text-emerald-600" : "bg-white border border-slate-300"
              }`}>
                {isSudah && <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3px]" />}
              </div>
              Sudah
            </button>

            {/* Checkbox Belum */}
            <button
              type="button"
              onClick={() => onToggleStatus(subClass.id, false)}
              className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border transition-all select-none cursor-pointer ${
                !isSudah
                  ? "bg-rose-500 border-rose-600 text-white shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center transition-colors ${
                !isSudah ? "bg-white text-rose-600" : "bg-white border border-slate-300"
              }`}>
                {!isSudah && <Check className="w-2.5 h-2.5 text-rose-600 stroke-[3px]" />}
              </div>
              Belum
            </button>
          </div>
        </div>

        {/* Context-aware action buttons */}
        <div className="flex items-center gap-2">
          {!isSudah && (
            <button
              type="button"
              className="p-1 px-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-transparent hover:border-amber-100 transition-all duration-150 cursor-pointer"
              onClick={() => onSendReminder(subClass)}
              title="Kirim pengingat ke Wali Kelas via WhatsApp"
            >
              <Bell className="w-4.5 h-4.5 text-amber-500" />
            </button>
          )}

          <button
            type="button"
            className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer border ${
              isSudah
                ? "bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 active:bg-emerald-200 border-emerald-100/80"
                : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs hover:shadow-sm"
            }`}
            onClick={() => onOpenAttendance(subClass)}
          >
            {isSudah ? "Edit Status" : "Input Absen"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
