/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { DailyAttendanceState, ClassSessionAttendance } from "../types";

// Dynamic keys configuration
const STORAGE_URL_KEY = "satset_supabase_url";
const STORAGE_KEY_KEY = "satset_supabase_key";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  // Try environment variables first, then fallback to localStorage overrides
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || "";
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";
  
  const localUrl = localStorage.getItem(STORAGE_URL_KEY) || "";
  const localKey = localStorage.getItem(STORAGE_KEY_KEY) || "";
  
  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url && anonKey) {
    localStorage.setItem(STORAGE_URL_KEY, url);
    localStorage.setItem(STORAGE_KEY_KEY, anonKey);
  } else {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  
  if (!url || !anonKey) {
    return null;
  }
  
  try {
    // Return cached or brand new client
    if (!supabaseInstance || (supabaseInstance as any).supabaseUrl !== url) {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
    return supabaseInstance;
  } catch (error) {
    console.error("Failed to initialize Supabase client", error);
    return null;
  }
}

/**
 * Sync single class attendance state to Supabase 'absensi' table
 */
export async function saveAttendanceToSupabase(
  classId: string,
  date: string,
  className: string,
  waliKelas: string,
  jenjang: string,
  jamIFilled: boolean,
  jamIIFilled: boolean,
  jamIIIFilled: boolean,
  records: ClassSessionAttendance
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const id = `${date}_${classId}`; // Composite primary key for easy upserts
  
  const { error } = await supabase
    .from("absensi")
    .upsert({
      id,
      tanggal: date,
      kelas_id: classId,
      kelas_nama: className,
      wali_kelas: waliKelas,
      jenjang,
      jam_i_filled: jamIFilled,
      jam_ii_filled: jamIIFilled,
      jam_iii_filled: jamIIIFilled,
      records,
      last_updated: new Date().toISOString()
    });

  if (error) {
    console.error("Supabase upsert error:", error);
    throw error;
  }
  return true;
}

/**
 * Load attendance status from Supabase 'absensi' table in bulk for specified date range
 */
export async function loadAttendanceFromSupabase(
  startDate: string,
  endDate: string
): Promise<DailyAttendanceState | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("absensi")
    .select("*")
    .gte("tanggal", startDate)
    .lte("tanggal", endDate);

  if (error) {
    console.error("Supabase load error:", error);
    throw error;
  }

  if (!data) return {};

  const state: DailyAttendanceState = {};
  
  data.forEach((row: any) => {
    const date = row.tanggal;
    const cid = row.kelas_id;
    
    if (!state[date]) {
      state[date] = {};
    }
    
    state[date][cid] = {
      jamIFilled: row.jam_i_filled,
      jamIIFilled: row.jam_ii_filled,
      jamIIIFilled: row.jam_iii_filled,
      records: row.records as ClassSessionAttendance,
      lastUpdated: row.last_updated
    };
  });
  
  return state;
}

/**
 * Generate starter SQL so the user knows exactly how to build the tables in their Supabase console.
 */
export const SUPABASE_STARTER_SQL = `-- REKOMENDASI SKRIP UNTUK CONSOLE SQL SUPABASE:
-- Buat tabel 'absensi'
CREATE TABLE IF NOT EXISTS absensi (
  id TEXT PRIMARY KEY, -- format: tanggal_kelas_id
  tanggal DATE NOT NULL,
  kelas_id TEXT NOT NULL,
  kelas_nama TEXT NOT NULL,
  wali_kelas TEXT NOT NULL,
  jenjang TEXT NOT NULL,
  jam_i_filled BOOLEAN DEFAULT FALSE,
  jam_ii_filled BOOLEAN DEFAULT FALSE,
  jam_iii_filled BOOLEAN DEFAULT FALSE,
  records JSONB NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL
);

-- Tambahkan index untuk pencarian cepat berdasarkan rentang tanggal
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);

-- Aktifkan rls jika diinginkan atau matikan untuk kemudahan akses anonim
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Public Access" ON absensi FOR ALL USING (true);
`;
