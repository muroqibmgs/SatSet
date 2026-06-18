/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  colorType: "success" | "warning" | "danger" | "info" | "primary";
  customContent?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorType,
  customContent
}: StatCardProps) {
  
  const colors = {
    success: {
      border: "border-emerald-100",
      bg: "bg-white",
      text: "text-emerald-800",
      iconBg: "bg-emerald-50 text-emerald-600",
      accent: "bg-emerald-500",
      statusText: "text-emerald-700 font-semibold"
    },
    warning: {
      border: "border-amber-100",
      bg: "bg-white",
      text: "text-amber-800",
      iconBg: "bg-amber-50 text-amber-600",
      accent: "bg-amber-500",
      statusText: "text-amber-700 font-semibold"
    },
    danger: {
      border: "border-rose-100",
      bg: "bg-white",
      text: "text-rose-800",
      iconBg: "bg-rose-50 text-rose-600",
      accent: "bg-rose-500",
      statusText: "text-rose-700 font-semibold"
    },
    info: {
      border: "border-sky-100",
      bg: "bg-white",
      text: "text-sky-800",
      iconBg: "bg-sky-50 text-sky-600",
      accent: "bg-sky-500",
      statusText: "text-sky-700 font-semibold"
    },
    primary: {
      border: "border-indigo-100",
      bg: "bg-white",
      text: "text-indigo-800",
      iconBg: "bg-indigo-50 text-indigo-600",
      accent: "bg-indigo-500",
      statusText: "text-indigo-700 font-semibold"
    }
  };

  const selectedColor = colors[colorType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border ${selectedColor.border} p-5.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between ${selectedColor.bg} cursor-default`}
    >
      {/* Elegantly placed left border accent stripe */}
      <span className={`absolute left-0 top-0 bottom-0 w-1.5 ${selectedColor.accent}`} />
      
      <div className="flex items-start justify-between pl-1">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {title}
          </span>
          <h3 className={`text-3xl font-extrabold tracking-tight ${selectedColor.text}`}>
            {value}
          </h3>
        </div>
        <div className={`${selectedColor.iconBg} p-2.5 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pl-1 border-t border-slate-50 pt-3">
        <span className="text-xs font-medium text-slate-500">
          {subtitle}
        </span>
        {customContent}
      </div>
    </motion.div>
  );
}
