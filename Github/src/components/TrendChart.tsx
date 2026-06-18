/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { DailyAttendanceState, SubClass } from "../types";
import { classesList, formatIndonesianDate, getDayOfWeek } from "../data/mockData";
import { CheckCircle2, AlertTriangle, AlertCircle, BookOpen } from "lucide-react";

interface TrendChartProps {
  attendanceData: DailyAttendanceState;
  classes: SubClass[];
}

export default function TrendChart({ attendanceData, classes }: TrendChartProps) {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);

  const datesList = ["2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"];
  const totalClasses = classes.length;

  const chartData = datesList.map((date) => {
    const dayData = attendanceData[date] || {};
    let lengkapCount = 0;
    let sebagianCount = 0;
    let belumCount = 0;

    classes.forEach((c) => {
      const clsState = dayData[c.id];
      const isSudah = clsState ? (clsState.jamIFilled || clsState.jamIIFilled || clsState.jamIIIFilled) : false;
      if (isSudah) {
        lengkapCount++;
      } else {
        belumCount++;
      }
    });

    const completionPercent = Math.round((lengkapCount / totalClasses) * 100);

    return {
      date,
      dayName: getDayOfWeek(date),
      lengkap: lengkapCount,
      sebagian: sebagianCount,
      belum: belumCount,
      percent: completionPercent
    };
  });

  // Calculate some analytics insights:
  // 1. Highest completion day
  // 2. Class leaderboard: Who hasn't submitted most often?
  const sortedByRank = [...chartData].sort((a, b) => b.percent - a.percent);
  const bestDay = sortedByRank[0];
  const worstDay = sortedByRank[sortedByRank.length - 1];

  // Frequency analysis of late/unfilled submissions by class (over the 5 days)
  const classLateTally: { [className: string]: { count: number; subClass: SubClass } } = {};
  classes.forEach((c) => {
    let unforcedUnfilledCount = 0;
    datesList.forEach((dt) => {
      const stateOnDay = attendanceData[dt]?.[c.id];
      const isSudah = stateOnDay ? (stateOnDay.jamIFilled || stateOnDay.jamIIFilled || stateOnDay.jamIIIFilled) : false;
      if (!isSudah) {
        unforcedUnfilledCount++;
      }
    });

    if (unforcedUnfilledCount > 0) {
      classLateTally[c.fullName] = {
        count: unforcedUnfilledCount,
        subClass: c
      };
    }
  });

  const chronicLateClasses = Object.entries(classLateTally)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Visualization Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6.5 lg:col-span-2 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-md font-extrabold text-slate-905 uppercase tracking-tight">Tren Penyelesaian Absensi Harian</h3>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Visualisasi persentase pengisian absensi lengkap per hari pembelajaran (Sabtu - Rabu) untuk 5 tanggal terakhir
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 bg-slate-50/50 px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-wider self-start md:self-auto">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-xs"></span> Lengkap (%)
              </span>
            </div>
          </div>

          {/* Core SVG graph */}
          <div className="relative h-64 w-full flex items-end justify-between px-6 pt-6 pb-2 border-b border-slate-100">
            
            {/* Horizontal Y-Axis indicators */}
            <div className="absolute inset-y-0 left-0 w-full flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-bold pr-4 mt-6 mb-2 uppercase">
              <div className="w-full flex justify-between border-t border-slate-100/70 pt-1"><span>100%</span></div>
              <div className="w-full flex justify-between border-t border-slate-100/70 pt-1"><span>75%</span></div>
              <div className="w-full flex justify-between border-t border-slate-100/70 pt-1"><span>50%</span></div>
              <div className="w-full flex justify-between border-t border-slate-100/70 pt-1"><span>25%</span></div>
              <div className="w-full flex justify-between border-t border-slate-100/70 pt-1"><span>0%</span></div>
            </div>

            {/* Rendering the bars */}
            <div className="relative z-10 w-full h-full flex items-end justify-around">
              {chartData.map((data, idx) => {
                const maxBarHeight = 180; // in px
                const barHeight = (data.percent / 100) * maxBarHeight;
                const isHovered = hoveredBar === data.date;

                return (
                  <div
                    key={data.date}
                    className="flex flex-col items-center group relative cursor-pointer"
                    onMouseEnter={() => setHoveredBar(data.date)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{ width: "16%" }}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-18 bg-slate-900 border border-slate-800 text-white rounded-2xl p-3 shadow-xl text-center z-20 w-44 transition-all duration-200">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase">{data.dayName}</span>
                        <span className="block text-sm font-extrabold mt-0.5">{data.percent}% Selesai</span>
                        <div className="flex items-center justify-around gap-1 mt-1 text-[9px] font-bold text-slate-300">
                          <span className="text-emerald-400">{data.lengkap} Lengkap</span>
                          <span>&bull;</span>
                          <span className="text-amber-400">{data.sebagian} Sebagian</span>
                        </div>
                      </div>
                    )}

                    {/* Stacked bar or visual bar indicating progress */}
                    <div 
                      className="w-full bg-slate-50/70 hover:bg-slate-100/80 rounded-t-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-end border border-transparent hover:border-slate-100"
                      style={{ height: `${maxBarHeight}px` }}
                    >
                      {/* Submissions portions */}
                      <div 
                        className={`w-full bg-indigo-600 rounded-t-xl transition-all duration-500 relative ${
                          isHovered ? "bg-indigo-700 scale-x-[1.03] shadow-lg shadow-indigo-600/20" : ""
                        }`}
                        style={{ height: `${barHeight}px` }}
                      >
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/15 to-transparent h-full"></div>
                        
                        {/* Shimmer effect for top of bar */}
                        <div className="h-1 bg-white/25 w-full absolute top-0"></div>
                      </div>
                    </div>

                    {/* Day & Date Label */}
                    <div className="mt-3.5 text-center">
                      <span className="block text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600">
                        {data.dayName}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-bold tracking-wider">
                        {data.date.split("-")[2]}/{data.date.split("-")[1]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
          
          {/* Summary Footer bar */}
          <div className="mt-4 flex flex-wrap gap-4 items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="p-1 px-2.5 bg-slate-50 border border-slate-100 rounded-lg">Hari Disorot: 5 Tanggal</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Tinggi Bar menunjukkan rasio Kelas dengan status Absensi Lengkap.
            </div>
          </div>
        </div>

        {/* Insight Panel / Analytics Container */}
        <div className="space-y-6">
          
          {/* Top Performance Analytics card */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-850 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <BookOpen className="w-40 h-40 transform translate-x-10 translate-y-12" />
            </div>

            <h4 className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">Sorotan Analisis Mingguan</h4>
            
            <div className="mt-5 space-y-4">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Penyelesaian Tertinggi</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-white uppercase">{bestDay?.dayName}</span>
                  <span className="text-emerald-400 font-bold text-xs">({bestDay?.percent}% Lengkap)</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Penyelesaian Terendah</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-white uppercase">{worstDay?.dayName}</span>
                  <span className="text-rose-400 font-bold text-xs">({worstDay?.percent}% Lengkap)</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed pt-2">
                Kepatuhan absensi rata-rata adalah <strong className="text-indigo-300 font-extrabold">{Math.round(chartData.reduce((acc, d) => acc + d.percent, 0) / 5)}%</strong>. Direkomendasikan melakukan broadcast berkala setiap awal sesi Jam II.
              </p>
            </div>
          </div>

          {/* Leaders Board of chronic non-inputs */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Kelas Butuh Pendampingan Absensi
            </h4>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Daftar sub-kelas dengan tingkat kekosongan tertinggi selama 5 hari pelajaran terakhir
            </p>

            <div className="mt-5 divide-y divide-slate-100">
              {chronicLateClasses.length > 0 ? (
                chronicLateClasses.map(([className, entry]) => (
                  <div key={className} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <span className="font-extrabold text-slate-900 text-xs uppercase">{className}</span>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">{entry.subClass.jenjang} &bull; Wali: {entry.subClass.waliKelas.split(",")[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex px-2 py-1 text-[9px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wider">
                        {entry.count}x Kosong
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-semibold italic">
                  Semua kelas telah disiplin mengisi absensi harian!
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
