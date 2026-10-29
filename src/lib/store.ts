export type Gender = "male" | "female";

export interface CertData {
  type: string;
  studentName: string;
  gender: Gender;
  grade: string;
  appreciation: string;
  score: string;
  date: string; // yyyy-mm-dd
  note: string;
  serial: string;
}

export interface HistoryItem {
  id: string;
  data: CertData;
  savedAt: number;
}

const PIN_KEY = "mo_pin_hash_v1";
const DRAFT_KEY = "mo_draft_v1";
const HISTORY_KEY = "mo_history_v1";
const TOTAL_KEY = "mo_total_v1";

/* ---------- PIN ---------- */

export function hashPin(pin: string): string {
  let h = 5381;
  const salted = `mo-issa::${pin}::arabic`;
  for (let i = 0; i < salted.length; i++) {
    h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(36)}`;
}

export function getPinHash(): string | null {
  return localStorage.getItem(PIN_KEY);
}

export function setPinHash(hash: string) {
  localStorage.setItem(PIN_KEY, hash);
}

/* ---------- draft ---------- */

export function loadDraft(): CertData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CertData) : null;
  } catch {
    return null;
  }
}

export function saveDraft(data: CertData) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

/* ---------- history & stats ---------- */

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
}

export function loadTotal(): number {
  const n = parseInt(localStorage.getItem(TOTAL_KEY) || "0", 10);
  return Number.isFinite(n) ? n : 0;
}

export function saveTotal(n: number) {
  localStorage.setItem(TOTAL_KEY, String(n));
}

/* ---------- helpers ---------- */

export function newSerial(): string {
  const year = new Date().getFullYear();
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `MO-${year}-${rnd}`;
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => AR_DIGITS[parseInt(d, 10)]);
}

export function formatCertDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function academicYear(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const start = d.getMonth() + 1 >= 9 ? y : y - 1;
  return toArabicDigits(`${start} / ${start + 1}`);
}
