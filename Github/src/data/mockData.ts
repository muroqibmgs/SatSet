/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SubClass, Student, DailyAttendanceState } from "../types";

// Generate realistic students for classes
const createStudentsForClass = (classPrefix: string, count: number): Student[] => {
  const firstNames = [
    "Ahmad", "Muhammad", "Ali", "Hasan", "Hussein", "Zainal", "Abdurrahman", 
    "Siti", "Aisyah", "Fatimah", "Khadijah", "Lukman", "M. Zaki", "Hamdan", "Rizky", 
    "Ibnu", "Thariq", "Hafiz", "Maulana", "Arif", "Farhan", "Bagas", "Aditya", "Fajar"
  ];
  const lastNames = [
    "Jazuli", "Abidin", "Lutfi", "Fadhlilah", "Zaky", "Mubarrrok", "Najib", "Hakim",
    "Pratama", "Syahputra", "Sidiq", "Wafi", "Anshori", "Nashrullah", "Niam", "Habibi",
    "Fathur", "Haris", "Rosyid", "Ramadhan", "Rojabi", "Faisal", "Wahid", "Sanjaya"
  ];

  const students: Student[] = [];
  const seed = classPrefix.charCodeAt(0) + (classPrefix.charCodeAt(classPrefix.length - 1) || 0);
  
  for (let i = 1; i <= count; i++) {
    const fIdx = (seed + i * 3) % firstNames.length;
    const lIdx = (seed + i * 7) % lastNames.length;
    const nama = `${firstNames[fIdx]} ${lastNames[lIdx]}`.toUpperCase();
    students.push({
      id: `${classPrefix.toLowerCase().replace(/\s+/g, "-")}-s${i}`,
      absenNo: i * 2 - (i % 2), // Gives a non-consecutive realistic feel like in the screenshots
      nama: nama
    });
  }
  return students;
};

// Seed Wali Kelas names based on typical Madrasah titles
const waliKelasTemplates = [
  "Ust. Ahmad Jazuli, S.Pd.I.",
  "Ust. H. Abdurrahman, M.Pd.",
  "Ustdz. Siti Aminah, S.Pd.",
  "Ust. M. Ridwan, S.H.",
  "Ustdz. Nurul Hidayah, S.Pd.",
  "Ust. Lukman Hakim, M.Ag.",
  "Ust. Thariq Al-Fatih, S.Hum.",
  "Ustdz. Hamidah, S.Th.I.",
  "Ust. Sholehuddin, M.Pd.I.",
  "Ust. Fauzan Azhim, S.Ag.",
  "Ust. KH. Anas Mahfudz",
  "Ustdz. Lailatul Qadriyah, S.Pd."
];

const getWaliKelas = (idx: number): string => {
  return waliKelasTemplates[idx % waliKelasTemplates.length];
};

// 1. Definition of all classes
export const classesList: SubClass[] = [
  // --- IBTIDA'IYYAH (Grade 3-6) ---
  {
    id: "3-ibtida-a",
    jenjang: "Ibtida'iyyah",
    tingkat: 3,
    subName: "A",
    fullName: "3 IBTIDA'IYYAH A",
    waliKelas: "UST. SA'ID MUHANNI",
    students: createStudentsForClass("3 Ibtida'iyyah A", 12)
  },
  {
    id: "3-ibtida-b",
    jenjang: "Ibtida'iyyah",
    tingkat: 3,
    subName: "B",
    fullName: "3 IBTIDA'IYYAH B",
    waliKelas: "UST. KHOIRUL ANWAR",
    students: createStudentsForClass("3 Ibtida'iyyah B", 11)
  },
  {
    id: "4-ibtida-a",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "A",
    fullName: "4 IBTIDA'IYYAH A",
    waliKelas: "UST. M. IZZUDDIN",
    students: createStudentsForClass("4 Ibtida'iyyah A", 13)
  },
  {
    id: "4-ibtida-b",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "B",
    fullName: "4 IBTIDA'IYYAH B",
    waliKelas: "UST. IBNU ATO'ILLAH",
    students: createStudentsForClass("4 Ibtida'iyyah B", 10)
  },
  {
    id: "4-ibtida-c",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "C",
    fullName: "4 IBTIDA'IYYAH C",
    waliKelas: "UST. MUHAMMAD RIZA",
    students: createStudentsForClass("4 Ibtida'iyyah C", 14)
  },
  {
    id: "4-ibtida-d",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "D",
    fullName: "4 IBTIDA'IYYAH D",
    waliKelas: "UST. DWI WAHYU ARDIYANSYAH",
    students: createStudentsForClass("4 Ibtida'iyyah D", 12)
  },
  {
    id: "4-ibtida-e",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "E",
    fullName: "4 IBTIDA'IYYAH E",
    waliKelas: "UST. MUHAMMAD AL WATSIQ",
    students: createStudentsForClass("4 Ibtida'iyyah E", 11)
  },
  {
    id: "4-ibtida-f",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "F",
    fullName: "4 IBTIDA'IYYAH F",
    waliKelas: "UST. BADRUDDUJA HASYIM",
    students: createStudentsForClass("4 Ibtida'iyyah F", 13)
  },
  {
    id: "4-ibtida-g",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "G",
    fullName: "4 IBTIDA'IYYAH G",
    waliKelas: "UST. MUHAMMAD ZUBAIR",
    students: createStudentsForClass("4 Ibtida'iyyah G", 10)
  },
  {
    id: "4-ibtida-h",
    jenjang: "Ibtida'iyyah",
    tingkat: 4,
    subName: "H",
    fullName: "4 IBTIDA'IYYAH H",
    waliKelas: "UST. M. IDRIS ASY'ARI",
    students: createStudentsForClass("4 Ibtida'iyyah H", 12)
  },
  {
    id: "5-ibtida-a",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "A",
    fullName: "5 IBTIDA'IYYAH A",
    waliKelas: "UST. WILDAN MUSTOFA",
    students: createStudentsForClass("5 Ibtida'iyyah A", 14)
  },
  {
    id: "5-ibtida-b",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "B",
    fullName: "5 IBTIDA'IYYAH B",
    waliKelas: "UST. ABDUL MAJID",
    students: createStudentsForClass("5 Ibtida'iyyah B", 11)
  },
  {
    id: "5-ibtida-c",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "C",
    fullName: "5 IBTIDA'IYYAH C",
    waliKelas: "UST. ULIL ABSHOR",
    students: createStudentsForClass("5 Ibtida'iyyah C", 13)
  },
  {
    id: "5-ibtida-d",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "D",
    fullName: "5 IBTIDA'IYYAH D",
    waliKelas: "UST. RIFQI ARDIYAN SYAH",
    students: createStudentsForClass("5 Ibtida'iyyah D", 10)
  },
  {
    id: "5-ibtida-e",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "E",
    fullName: "5 IBTIDA'IYYAH E",
    waliKelas: "UST. ACHMAD ABUBAKAR",
    students: createStudentsForClass("5 Ibtida'iyyah E", 12)
  },
  {
    id: "5-ibtida-f",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "F",
    fullName: "5 IBTIDA'IYYAH F",
    waliKelas: "UST. SOFI NUR AMNI",
    students: createStudentsForClass("5 Ibtida'iyyah F", 14)
  },
  {
    id: "5-ibtida-g",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "G",
    fullName: "5 IBTIDA'IYYAH G",
    waliKelas: "UST. AHMAD FAIZ",
    students: createStudentsForClass("5 Ibtida'iyyah G", 11)
  },
  {
    id: "5-ibtida-h",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "H",
    fullName: "5 IBTIDA'IYYAH H",
    waliKelas: "UST. ULIL ALBAB",
    students: createStudentsForClass("5 Ibtida'iyyah H", 13)
  },
  {
    id: "5-ibtida-i",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "I",
    fullName: "5 IBTIDA'IYYAH I",
    waliKelas: "UST. AGIL THORIQ",
    students: createStudentsForClass("5 Ibtida'iyyah I", 10)
  },
  {
    id: "5-ibtida-j",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "J",
    fullName: "5 IBTIDA'IYYAH J",
    waliKelas: "UST. MULTAZAM",
    students: createStudentsForClass("5 Ibtida'iyyah J", 12)
  },
  {
    id: "5-ibtida-k",
    jenjang: "Ibtida'iyyah",
    tingkat: 5,
    subName: "K",
    fullName: "5 IBTIDA'IYYAH K",
    waliKelas: "UST. BALYA BISRUL KHOFI",
    students: createStudentsForClass("5 Ibtida'iyyah K", 14)
  },
  {
    id: "6-ibtida-a",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "A",
    fullName: "6 IBTIDA'IYYAH A",
    waliKelas: "UST. NAILUN NAJAAKH",
    students: createStudentsForClass("6 Ibtida'iyyah A", 11)
  },
  {
    id: "6-ibtida-b",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "B",
    fullName: "6 IBTIDA'IYYAH B",
    waliKelas: "UST. FATIKHUL ABROR",
    students: createStudentsForClass("6 Ibtida'iyyah B", 13)
  },
  {
    id: "6-ibtida-c",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "C",
    fullName: "6 IBTIDA'IYYAH C",
    waliKelas: "UST. ABDULLAH MUFID",
    students: createStudentsForClass("6 Ibtida'iyyah C", 10)
  },
  {
    id: "6-ibtida-d",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "D",
    fullName: "6 IBTIDA'IYYAH D",
    waliKelas: "UST. M. ZAMZAM MUBAROK WIFQI",
    students: createStudentsForClass("6 Ibtida'iyyah D", 12)
  },
  {
    id: "6-ibtida-e",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "E",
    fullName: "6 IBTIDA'IYYAH E",
    waliKelas: "UST. AHMAD LATIFUS SHOLEH",
    students: createStudentsForClass("6 Ibtida'iyyah E", 14)
  },
  {
    id: "6-ibtida-f",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "F",
    fullName: "6 IBTIDA'IYYAH F",
    waliKelas: "UST. M. KHUSNUN NADHIF",
    students: createStudentsForClass("6 Ibtida'iyyah F", 11)
  },
  {
    id: "6-ibtida-g",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "G",
    fullName: "6 IBTIDA'IYYAH G",
    waliKelas: "UST. MUHAMMAD BURHANUDDIN",
    students: createStudentsForClass("6 Ibtida'iyyah G", 13)
  },
  {
    id: "6-ibtida-h",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "H",
    fullName: "6 IBTIDA'IYYAH H",
    waliKelas: "UST. SIROJ TOYYIB",
    students: createStudentsForClass("6 Ibtida'iyyah H", 10)
  },
  {
    id: "6-ibtida-i",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "I",
    fullName: "6 IBTIDA'IYYAH I",
    waliKelas: "UST. M. RIASY MAHDI",
    students: createStudentsForClass("6 Ibtida'iyyah I", 12)
  },
  {
    id: "6-ibtida-j",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "J",
    fullName: "6 IBTIDA'IYYAH J",
    waliKelas: "UST. ABDUL KARIM NASHIH",
    students: createStudentsForClass("6 Ibtida'iyyah J", 14)
  },
  {
    id: "6-ibtida-k",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "K",
    fullName: "6 IBTIDA'IYYAH K",
    waliKelas: "UST. HUSNUL MUBAROK",
    students: createStudentsForClass("6 Ibtida'iyyah K", 11)
  },
  {
    id: "6-ibtida-l",
    jenjang: "Ibtida'iyyah",
    tingkat: 6,
    subName: "L",
    fullName: "6 IBTIDA'IYYAH L",
    waliKelas: "UST. M. ABDULLOH AL WAFI",
    students: createStudentsForClass("6 Ibtida'iyyah L", 13)
  },

  // --- TSANAWIYYAH (Grade 1-3) ---
  {
    id: "1-tsanawiyyah-a",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "A",
    fullName: "1 TSANAWIYYAH A",
    waliKelas: "UST. MUHAMMAD MAJID KAMIL",
    students: createStudentsForClass("1 Tsanawiyyah A", 12)
  },
  {
    id: "1-tsanawiyyah-b",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "B",
    fullName: "1 TSANAWIYYAH B",
    waliKelas: "UST. FARIS SIDQI",
    students: createStudentsForClass("1 Tsanawiyyah B", 14)
  },
  {
    id: "1-tsanawiyyah-c",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "C",
    fullName: "1 TSANAWIYYAH C",
    waliKelas: "UST. ABDULLOH",
    students: createStudentsForClass("1 Tsanawiyyah C", 11)
  },
  {
    id: "1-tsanawiyyah-d",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "D",
    fullName: "1 TSANAWIYYAH D",
    waliKelas: "UST. M DHIYAUDDIN",
    students: createStudentsForClass("1 Tsanawiyyah D", 13)
  },
  {
    id: "1-tsanawiyyah-e",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "E",
    fullName: "1 TSANAWIYYAH E",
    waliKelas: "UST. SULTHONUL ULAMA'",
    students: createStudentsForClass("1 Tsanawiyyah E", 10)
  },
  {
    id: "1-tsanawiyyah-f",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "F",
    fullName: "1 TSANAWIYYAH F",
    waliKelas: "UST NUR SUBHI",
    students: createStudentsForClass("1 Tsanawiyyah F", 12)
  },
  {
    id: "1-tsanawiyyah-g",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "G",
    fullName: "1 TSANAWIYYAH G",
    waliKelas: "UST. MUHAMMAD IQYAN ROSYADI",
    students: createStudentsForClass("1 Tsanawiyyah G", 14)
  },
  {
    id: "1-tsanawiyyah-h",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "H",
    fullName: "1 TSANAWIYYAH H",
    waliKelas: "UST. AHMAD BAHA'UDDIN",
    students: createStudentsForClass("1 Tsanawiyyah H", 11)
  },
  {
    id: "1-tsanawiyyah-i",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "I",
    fullName: "1 TSANAWIYYAH I",
    waliKelas: "UST MOCH KHOTIBUL UMAM",
    students: createStudentsForClass("1 Tsanawiyyah I", 13)
  },
  {
    id: "1-tsanawiyyah-j",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "J",
    fullName: "1 TSANAWIYYAH J",
    waliKelas: "UST MOHAMMAD MIFTAH HUDIN",
    students: createStudentsForClass("1 Tsanawiyyah J", 10)
  },
  {
    id: "1-tsanawiyyah-k",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "K",
    fullName: "1 TSANAWIYYAH K",
    waliKelas: "UST ABDURROHMAN BIN KUDJAENI",
    students: createStudentsForClass("1 Tsanawiyyah K", 12)
  },
  {
    id: "1-tsanawiyyah-l",
    jenjang: "Tsanawiyyah",
    tingkat: 1,
    subName: "L",
    fullName: "1 TSANAWIYYAH L",
    waliKelas: "UST. MUH SALMAN UMAR",
    students: createStudentsForClass("1 Tsanawiyyah L", 14)
  },
  {
    id: "2-tsanawiyyah-a",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "A",
    fullName: "2 TSANAWIYYAH A",
    waliKelas: "UST. M ITMAMUL WAFA",
    students: createStudentsForClass("2 Tsanawiyyah A", 11)
  },
  {
    id: "2-tsanawiyyah-b",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "B",
    fullName: "2 TSANAWIYYAH B",
    waliKelas: "UST AINUL WAFI",
    students: createStudentsForClass("2 Tsanawiyyah B", 13)
  },
  {
    id: "2-tsanawiyyah-c",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "C",
    fullName: "2 TSANAWIYYAH C",
    waliKelas: "UST AHMAD THONTOWI",
    students: createStudentsForClass("2 Tsanawiyyah C", 10)
  },
  {
    id: "2-tsanawiyyah-d",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "D",
    fullName: "2 TSANAWIYYAH D",
    waliKelas: "UST. ABDURROHMAN BIN SYUHUD",
    students: createStudentsForClass("2 Tsanawiyyah D", 12)
  },
  {
    id: "2-tsanawiyyah-e",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "E",
    fullName: "2 TSANAWIYYAH E",
    waliKelas: "UST A UMAR JAMALUDDIN",
    students: createStudentsForClass("2 Tsanawiyyah E", 14)
  },
  {
    id: "2-tsanawiyyah-f",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "F",
    fullName: "2 TSANAWIYYAH F",
    waliKelas: "UST MUHAMMAD HANIF",
    students: createStudentsForClass("2 Tsanawiyyah F", 11)
  },
  {
    id: "2-tsanawiyyah-g",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "G",
    fullName: "2 TSANAWIYYAH G",
    waliKelas: "UST MUHARROM SYAIFUL AZIZ",
    students: createStudentsForClass("2 Tsanawiyyah G", 13)
  },
  {
    id: "2-tsanawiyyah-h",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "H",
    fullName: "2 TSANAWIYYAH H",
    waliKelas: "UST M. ALWI SHOLAHUDDIN",
    students: createStudentsForClass("2 Tsanawiyyah H", 10)
  },
  {
    id: "2-tsanawiyyah-i",
    jenjang: "Tsanawiyyah",
    tingkat: 2,
    subName: "I",
    fullName: "2 TSANAWIYYAH I",
    waliKelas: "UST NASRUL FATA",
    students: createStudentsForClass("2 Tsanawiyyah I", 12)
  },
  {
    id: "3-tsanawiyyah-a",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "A",
    fullName: "3 TSANAWIYYAH A",
    waliKelas: "UST MUHAMMAD DURRUN NAFIS",
    students: createStudentsForClass("3 Tsanawiyyah A", 14)
  },
  {
    id: "3-tsanawiyyah-b",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "B",
    fullName: "3 TSANAWIYYAH B",
    waliKelas: "UST M NURUL AMIN",
    students: createStudentsForClass("3 Tsanawiyyah B", 11)
  },
  {
    id: "3-tsanawiyyah-c",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "C",
    fullName: "3 TSANAWIYYAH C",
    waliKelas: "UST. A. SYIHABUDDIN",
    students: createStudentsForClass("3 Tsanawiyyah C", 13)
  },
  {
    id: "3-tsanawiyyah-d",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "D",
    fullName: "3 TSANAWIYYAH D",
    waliKelas: "UST. M. JUNAIDI",
    students: createStudentsForClass("3 Tsanawiyyah D", 10)
  },
  {
    id: "3-tsanawiyyah-e",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "E",
    fullName: "3 TSANAWIYYAH E",
    waliKelas: "UST AZFA SHIHABUL MILLAH",
    students: createStudentsForClass("3 Tsanawiyyah E", 12)
  },
  {
    id: "3-tsanawiyyah-f",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "F",
    fullName: "3 TSANAWIYYAH F",
    waliKelas: "UST ANIQ MAFTUHIN",
    students: createStudentsForClass("3 Tsanawiyyah F", 14)
  },
  {
    id: "3-tsanawiyyah-g",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "G",
    fullName: "3 TSANAWIYYAH G",
    waliKelas: "UST A DIMYATI",
    students: createStudentsForClass("3 Tsanawiyyah G", 11)
  },
  {
    id: "3-tsanawiyyah-h",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "H",
    fullName: "3 TSANAWIYYAH H",
    waliKelas: "UST M. NAJIH",
    students: createStudentsForClass("3 Tsanawiyyah H", 13)
  },
  {
    id: "3-tsanawiyyah-i",
    jenjang: "Tsanawiyyah",
    tingkat: 3,
    subName: "I",
    fullName: "3 TSANAWIYYAH I",
    waliKelas: "UST ALFIN NUR KHOIRI",
    students: createStudentsForClass("3 Tsanawiyyah I", 12)
  },

  // --- ALIYAH (Grade 1-3) ---
  {
    id: "1-aliyah-a",
    jenjang: "Aliyah",
    tingkat: 1,
    subName: "A",
    fullName: "1 ALIYAH A",
    waliKelas: "UST SAIFUL BAHRI",
    students: createStudentsForClass("1 Aliyah A", 12)
  },
  {
    id: "1-aliyah-b",
    jenjang: "Aliyah",
    tingkat: 1,
    subName: "B",
    fullName: "1 ALIYAH B",
    waliKelas: "UST M KASMUDI",
    students: createStudentsForClass("1 Aliyah B", 14)
  },
  {
    id: "1-aliyah-c",
    jenjang: "Aliyah",
    tingkat: 1,
    subName: "C",
    fullName: "1 ALIYAH C",
    waliKelas: "UST ITMAM HAKAM",
    students: createStudentsForClass("1 Aliyah C", 11)
  },
  {
    id: "1-aliyah-d",
    jenjang: "Aliyah",
    tingkat: 1,
    subName: "D",
    fullName: "1 ALIYAH D",
    waliKelas: "UST AHMAD MUZAKKY",
    students: createStudentsForClass("1 Aliyah D", 13)
  },
  {
    id: "1-aliyah-e",
    jenjang: "Aliyah",
    tingkat: 1,
    subName: "E",
    fullName: "1 ALIYAH E",
    waliKelas: "UST JALALUDDIN",
    students: createStudentsForClass("1 Aliyah E", 10)
  },
  {
    id: "1-aliyah-f",
    jenjang: "Aliyah",
    tingkat: 1,
    subName: "F",
    fullName: "1 ALIYAH F",
    waliKelas: "UST NURUL WALID",
    students: createStudentsForClass("1 Aliyah F", 12)
  },
  {
    id: "2-aliyah-a",
    jenjang: "Aliyah",
    tingkat: 2,
    subName: "A",
    fullName: "2 ALIYAH A",
    waliKelas: "UST MUH SHOLAHUDDIN",
    students: createStudentsForClass("2 Aliyah A", 14)
  },
  {
    id: "2-aliyah-b",
    jenjang: "Aliyah",
    tingkat: 2,
    subName: "B",
    fullName: "2 ALIYAH B",
    waliKelas: "UST BAHA'UDDIN HUSAIN",
    students: createStudentsForClass("2 Aliyah B", 11)
  },
  {
    id: "2-aliyah-c",
    jenjang: "Aliyah",
    tingkat: 2,
    subName: "C",
    fullName: "2 ALIYAH C",
    waliKelas: "UST ABDULLOH M AMIN",
    students: createStudentsForClass("2 Aliyah C", 13)
  },
  {
    id: "2-aliyah-d",
    jenjang: "Aliyah",
    tingkat: 2,
    subName: "D",
    fullName: "2 ALIYAH D",
    waliKelas: "UST AMIN SYAFAWI",
    students: createStudentsForClass("2 Aliyah D", 10)
  },
  {
    id: "3-aliyah-a",
    jenjang: "Aliyah",
    tingkat: 3,
    subName: "A",
    fullName: "3 ALIYAH A",
    waliKelas: "KH ABDUR ROUF MZ",
    students: createStudentsForClass("3 Aliyah A", 12)
  },
  {
    id: "3-aliyah-b",
    jenjang: "Aliyah",
    tingkat: 3,
    subName: "B",
    fullName: "3 ALIYAH B",
    waliKelas: "KH FAISHOL ZM",
    students: createStudentsForClass("3 Aliyah B", 14)
  },
  {
    id: "3-aliyah-c",
    jenjang: "Aliyah",
    tingkat: 3,
    subName: "C",
    fullName: "3 ALIYAH C",
    waliKelas: "KH MUHSININ HUSNAN",
    students: createStudentsForClass("3 Aliyah C", 11)
  },
  {
    id: "3-aliyah-d",
    jenjang: "Aliyah",
    tingkat: 3,
    subName: "D",
    fullName: "3 ALIYAH D",
    waliKelas: "KH A USTUHKRI IRSYAD",
    students: createStudentsForClass("3 Aliyah D", 13)
  }
];

// Helper to generate realistic starting state based on user's calendar screenshots (June 2026)
// Dates: "2026-06-06" (Sabtu), "2026-06-07" (Ahad), "2026-06-08" (Senin), "2026-06-09" (Selasa), "2026-06-10" (Rabu)
export const generateInitialState = (): DailyAttendanceState => {
  const dates = ["2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"];
  const state: DailyAttendanceState = {};

  const statuses: ("HADIR" | "GHOIB" | "IZIN" | "SAKIT")[] = [
    "HADIR", "HADIR", "HADIR", "HADIR", "HADIR", "HADIR", "HADIR", "HADIR", 
    "IZIN", "SAKIT", "GHOIB", "HADIR", "HADIR", "HADIR"
  ];

  for (const date of dates) {
    state[date] = {};
    
    // Seed each class
    for (const subClass of classesList) {
      const clsId = subClass.id;
      
      // We vary submission rate by class ID and date to make the dashboard feel alive and accurate!
      // In Madrasahs, Aliyah and Tsanawiyyah are larger levels, let's make some submitted, some partial, some completely missing.
      let jamIFilled = false;
      let jamIIFilled = false;
      let jamIIIFilled = false;

      const seedNum = (clsId.charCodeAt(0) + (clsId.charCodeAt(clsId.length - 1) || 0) + date.charCodeAt(date.length - 1)) % 10;
      
      if (seedNum < 5) {
        // 50% chance: Fully Filled (Lengkap)
        jamIFilled = true;
        jamIIFilled = true;
        jamIIIFilled = true;
      } else if (seedNum < 8) {
        // 30% chance: Partially Filled (Sebagian)
        jamIFilled = true;
        jamIIFilled = seedNum !== 7; // sometimes Jam II is filled, sometimes not
        jamIIIFilled = false; // Jam III is rare in partials
      } else {
        // 20% chance: Completely Unfilled (Belum Input)
        jamIFilled = false;
        jamIIFilled = false;
        jamIIIFilled = false;
      }

      // Generate actual student records
      const jamIRecords = subClass.students.map((st, idx) => ({
        studentId: st.id,
        status: jamIFilled ? statuses[(idx + seedNum) % statuses.length] : "BELUM_INPUT" as any
      }));
      
      const jamIIRecords = subClass.students.map((st, idx) => ({
        studentId: st.id,
        status: jamIIFilled ? statuses[(idx + seedNum + 1) % statuses.length] : "BELUM_INPUT" as any
      }));
      
      const jamIIIRecords = subClass.students.map((st, idx) => ({
        studentId: st.id,
        status: jamIIIFilled ? statuses[(idx + seedNum + 2) % statuses.length] : "BELUM_INPUT" as any
      }));

      state[date][clsId] = {
        jamIFilled,
        jamIIFilled,
        jamIIIFilled,
        records: {
          jamI: jamIRecords,
          jamII: jamIIRecords,
          jamIII: jamIIIRecords
        },
        lastUpdated: new Date(date + `T${10 + (seedNum % 4)}:${15 + (seedNum * 3)}:00`).toISOString()
      };
    }
  }

  return state;
};

// Formats localized Indonesian dates
export const formatIndonesianDate = (dateString: string): string => {
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  return `${days[d.getDay()]}, ${parts[2]} ${months[d.getMonth()]} ${parts[0]}`;
};

// Returns day of week number (0: Sunday/Ahad, 1: Senin, ..., 6: Sabtu)
export const getDayOfWeek = (dateString: string): string => {
  const parts = dateString.split("-");
  if (parts.length !== 3) return "";
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[d.getDay()];
};
