/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PendidikanJenjang = "Ibtida'iyyah" | "Tsanawiyyah" | "Aliyah";

export interface Student {
  id: string;
  absenNo: number;
  nama: string;
}

export interface SubClass {
  id: string; // e.g., "1-aliyah-a"
  jenjang: PendidikanJenjang;
  tingkat: number; // 1, 2, 3, 4, 5, 6
  subName: string; // "A", "B", "C", "K", "L" etc.
  fullName: string; // "1 ALIYAH A"
  waliKelas: string; // Name of homeroom teacher
  students: Student[];
}

export type AttendanceStatus = "HADIR" | "GHOIB" | "IZIN" | "SAKIT" | "BELUM_INPUT";

// Attendance in individual session hour
export interface StudentSessionAttendance {
  studentId: string;
  status: AttendanceStatus;
}

export interface ClassSessionAttendance {
  jamI: StudentSessionAttendance[];
  jamII: StudentSessionAttendance[];
  jamIII: StudentSessionAttendance[];
}

// Attendance input state for each class and date
export interface DailyAttendanceState {
  [date: string]: { // Key format: YYYY-MM-DD
    [classId: string]: {
      jamIFilled: boolean;
      jamIIFilled: boolean;
      jamIIIFilled: boolean;
      records: ClassSessionAttendance;
      lastUpdated: string; // ISO string or time representation
    };
  };
}

export interface ReminderLog {
  id: string;
  classId: string;
  className: string;
  waliKelas: string;
  date: string;
  timestamp: string;
  jams: string[]; // e.g., ["Jam I", "Jam II"]
  success: boolean;
}
