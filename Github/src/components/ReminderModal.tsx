/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { SubClass } from "../types";
import { X, Send, Copy, Check, MessageSquare } from "lucide-react";
import { formatIndonesianDate } from "../data/mockData";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  subClass: SubClass | null;
  date: string;
  unfilledJams: string[];
  onConfirmSend: (classId: string, className: string, waliKelas: string, jams: string[]) => void;
}

export default function ReminderModal({
  isOpen,
  onClose,
  subClass,
  date,
  unfilledJams,
  onConfirmSend
}: ReminderModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (isOpen && subClass) {
      setSuccess(false);
      setLoading(false);
      setCopied(false);
      
      const jamsStr = unfilledJams.join(", ");
      const formattedDate = formatIndonesianDate(date);
      const text = `Assalamualaikum Wr. Wb. Yth. *${subClass.waliKelas}*, kami dari Staff Kurikulum menginfokan bahwa absensi kelas *${subClass.fullName}* untuk hari *${formattedDate}* khususnya pada *[${jamsStr}]* belum terisi di sistem. Mohon bantuannya untuk segera melengkapi input absensi harian tersebut. Syukran katsiran atas kerja samanya. Wassalamualaikum Wr. Wb.`;
      
      setMessageText(text);
    }
  }, [isOpen, subClass, date, unfilledJams]);

  if (!isOpen || !subClass) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleSendSimulation = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      onConfirmSend(subClass.id, subClass.fullName, subClass.waliKelas, unfilledJams);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop overlay */}
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal content area */}
        <div className="inline-block align-middle bg-white rounded-3xl text-left overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.12)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100">
          
          {/* Header */}
          <div className="bg-slate-50/80 px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
              Kirim Pengingat Wali Kelas
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {success ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100/50 rounded-full flex items-center justify-center mb-4 shadow-xs">
                  <Check className="w-8 h-8 font-bold" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-905">Berhasil Dikirim!</h4>
                <p className="text-xs font-semibold text-slate-500 mt-2 max-w-xs">
                  Anotasi pengingat WhatsApp telah didistribusikan ke <strong className="text-slate-705 font-bold">{subClass.waliKelas}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-45">
                
                {/* Meta details */}
                <div className="p-4 bg-slate-50/70 border border-slate-200/50 rounded-2xl text-xs text-slate-600 space-y-1.5 font-semibold">
                  <div>Wali Kelas: <strong className="text-slate-800 font-bold">{subClass.waliKelas}</strong></div>
                  <div>Kelas: <strong className="text-slate-800 font-bold">{subClass.fullName}</strong></div>
                  <div>Hari/Tanggal: <strong className="text-slate-800 font-bold">{formatIndonesianDate(date)}</strong></div>
                  <div className="flex items-center gap-1.5">Jam Pelajaran: <span className="inline-flex gap-1.5">{unfilledJams.map(j => (
                    <span key={j} className="bg-amber-50 text-amber-700 border border-amber-100/60 px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider">{j}</span>
                  ))}</span></div>
                </div>

                {/* Simulated Phone WhatsApp message panel */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Draft Pesan WhatsApp</label>
                  <div className="relative mt-1">
                    <textarea
                      rows={6}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      disabled={loading}
                      className="w-full text-xs font-sans font-medium leading-relaxed p-4 bg-emerald-50/50 text-slate-800 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 focus:outline-hidden"
                    />
                    <div className="absolute top-3.5 right-3.5 flex gap-1">
                      <button
                        type="button"
                        onClick={handleCopyText}
                        className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg transition-all cursor-pointer shadow-xs border border-emerald-200/20"
                        title="Salin isi pesan"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {/* Tiny green phone footer accent */}
                    <div className="text-[10px] text-right text-emerald-600/80 font-bold px-1 mt-1 uppercase tracking-tight">
                      Pesan diformat otomatis untuk WhatsApp
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <p className="text-[10px] text-slate-400 font-semibold italic">
                  *Catatan: Mengklik tombol kirim akan mendistribusikan notifikasi sistem ke nomor WhatsApp Wali Kelas via scheduler server.
                </p>

              </div>
            )}
          </div>

          {/* Footer actions */}
          {!success && (
            <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex justify-end gap-2.5">
              <button
                type="button"
                className="px-4.5 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                disabled={loading}
                onClick={onClose}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:bg-slate-200 cursor-pointer"
                onClick={handleSendSimulation}
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? "Mengirim..." : "Kirim Pengingat"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
