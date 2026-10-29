import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { cn } from "./utils/cn";
import Certificate, { CERT_H, CERT_W } from "./components/Certificate";
import LockScreen from "./components/LockScreen";
import HistoryList from "./components/HistoryList";
import TeacherPhoto from "./components/TeacherPhoto";
import { APPRECIATIONS, CERT_TYPES, GRADES, defaultData, getType } from "./data/presets";
import type { CertData, Gender, HistoryItem } from "./lib/store";
import {
  loadDraft,
  loadHistory,
  loadTotal,
  newSerial,
  saveDraft,
  saveHistory,
  saveTotal,
  toArabicDigits,
} from "./lib/store";

/* ---------- inline icons ---------- */

const IconDownload = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v11m0 0 4.5-4.5M12 14 7.5 9.5" />
    <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

const IconRefresh = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 3v4h-4" />
  </svg>
);

const IconLock = ({ className = "h-4.5 w-4.5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);

const IconCheck = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

const IconAlert = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 4 2.8 20h18.4L12 4Z" />
    <path d="M12 10v4m0 3h.01" />
  </svg>
);

const IconReset = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4v5h5" />
    <path d="M4.6 9A8 8 0 1 1 4 12" />
  </svg>
);

/* ---------- small form primitives ---------- */

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block font-cairo text-[13px] font-bold text-cream">{children}</label>;
}

const inputCls =
  "w-full rounded-md border border-white/10 bg-[#0c211a] px-3 py-2.5 font-cairo text-sm text-cream placeholder:text-moss/50 outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20";

/* ---------- toast ---------- */

interface Toast {
  msg: string;
  kind: "success" | "error";
  key: number;
}

/* ---------- app ---------- */

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState<CertData>(() => {
    const draft = loadDraft();
    return draft ? { ...defaultData(), ...draft } : defaultData();
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [total, setTotal] = useState<number>(() => loadTotal());
  const [toast, setToast] = useState<Toast | null>(null);
  const [exporting, setExporting] = useState(false);
  const [fitMode, setFitMode] = useState<"fit" | "full">("fit");
  const [fitScale, setFitScale] = useState(0.55);

  const certRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => saveDraft(data), [data]);
  useEffect(() => saveHistory(history), [history]);
  useEffect(() => saveTotal(total), [total]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !unlocked) return;
    const ro = new ResizeObserver(() => {
      setFitScale(Math.min(1, el.clientWidth / CERT_W));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [unlocked]);

  const scale = fitMode === "fit" ? fitScale : 1;

  const patch = (p: Partial<CertData>) => setData((d) => ({ ...d, ...p }));

  const onTypeChange = (id: string) => {
    setData((d) => ({ ...d, type: id, note: getType(id).note(d.gender) }));
  };

  const onGenderChange = (g: Gender) => {
    setData((d) => ({ ...d, gender: g, note: getType(d.type).note(g) }));
  };

  const showToast = (msg: string, kind: Toast["kind"]) =>
    setToast({ msg, kind, key: Date.now() });

  const nameValid = data.studentName.trim().length >= 2;

  const download = async () => {
    if (!certRef.current || exporting) return;
    if (!nameValid) {
      showToast("اكتب اسم الطالب أولًا لتحميل الشهادة", "error");
      return;
    }
    setExporting(true);
    try {
      // انتظر دورة رسم واحدة حتى تستقر الخطوط والمعاينة
      await new Promise((r) => window.setTimeout(r, 60));
      const dataUrl = await toPng(certRef.current, {
        pixelRatio: 2,
        canvasWidth: CERT_W * 2,
        canvasHeight: CERT_H * 2,
        backgroundColor: "#f8f1dd",
      });
      const a = document.createElement("a");
      const safeName = data.studentName.trim().replace(/\s+/g, " ");
      a.download = `شهادة-${safeName}-${data.serial}.png`;
      a.href = dataUrl;
      a.click();

      const item: HistoryItem = {
        id: `${data.serial}-${Date.now()}`,
        data: { ...data },
        savedAt: Date.now(),
      };
      setHistory((h) => [item, ...h].slice(0, 12));
      setTotal((t) => t + 1);
      showToast("تم تحميل الشهادة بصيغة PNG بنجاح", "success");
    } catch (err) {
      console.error(err);
      showToast("حدث خطأ أثناء توليد الصورة — أعد المحاولة", "error");
    } finally {
      setExporting(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setData({ ...item.data });
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    showToast("تم استرجاع بيانات الشهادة إلى النموذج", "success");
  };

  if (!unlocked) {
    return <LockScreen onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-gold/15 bg-night/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <TeacherPhoto className="h-11 w-11 ring-2 ring-gold/60" />
            <div>
              <h1 className="font-ruqaa text-2xl leading-tight text-cream">أ / محمد عيسى</h1>
              <div className="font-cairo text-[11px] font-bold tracking-wide text-gold">
                مولِّد شهادات اللغة العربية
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden items-center gap-2.5 md:flex">
              <span className="rounded-md border border-white/10 bg-pine px-3 py-1.5 font-cairo text-xs font-bold text-moss">
                إجمالي الشهادات: <b className="text-gold">{toArabicDigits(total)}</b>
              </span>
              <span className="rounded-md border border-white/10 bg-pine px-3 py-1.5 font-cairo text-xs font-bold text-moss">
                بالسجل: <b className="text-gold">{toArabicDigits(history.length)}</b>
              </span>
            </div>
            <button
              onClick={() => setUnlocked(false)}
              className="flex items-center gap-2 rounded-md border border-gold/50 bg-gold/10 px-4 py-2 font-cairo text-sm font-extrabold text-gold transition hover:bg-gold/20 active:scale-95"
            >
              <IconLock />
              قفل الصفحة
            </button>
          </div>
        </div>
      </header>

      <main ref={topRef} className="mx-auto max-w-[1500px] scroll-mt-20 px-4 py-6 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          {/* ---------- form panel ---------- */}
          <aside className="animate-fade-up h-fit rounded-xl border border-white/10 bg-gradient-to-b from-pine to-[#0c2018] p-5 shadow-[0_20px_60px_-24px_rgba(0,0,0,.8)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-cairo text-lg font-black text-cream">بيانات الشهادة</h2>
              <button
                onClick={() => {
                  setData(defaultData());
                  showToast("تمت إعادة تعيين النموذج", "success");
                }}
                className="flex items-center gap-1.5 font-cairo text-xs font-bold text-moss transition hover:text-danger"
              >
                <IconReset />
                إعادة تعيين
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <Label>نوع الشهادة</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CERT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onTypeChange(t.id)}
                      className={cn(
                        "rounded-md border px-2 py-2 font-cairo text-[13px] font-bold transition active:scale-95",
                        data.type === t.id
                          ? "border-gold/70 bg-gold/15 text-gold-bright"
                          : "border-white/10 bg-[#0c211a] text-moss hover:border-gold/30 hover:text-cream"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>اسم الطالب / الطالبة</Label>
                <input
                  value={data.studentName}
                  onChange={(e) => patch({ studentName: e.target.value })}
                  placeholder="مثال: أحمد محمود عبد العزيز"
                  className={cn(inputCls, "font-naskh text-base")}
                />
              </div>

              <div>
                <Label>النوع</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { g: "male", label: "طالب" },
                      { g: "female", label: "طالبة" },
                    ] as { g: Gender; label: string }[]
                  ).map(({ g, label }) => (
                    <button
                      key={g}
                      onClick={() => onGenderChange(g)}
                      className={cn(
                        "rounded-md border py-2 font-cairo text-[13px] font-bold transition active:scale-95",
                        data.gender === g
                          ? "border-gold/70 bg-gold/15 text-gold-bright"
                          : "border-white/10 bg-[#0c211a] text-moss hover:border-gold/30 hover:text-cream"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الصف الدراسي</Label>
                  <select
                    value={data.grade}
                    onChange={(e) => patch({ grade: e.target.value })}
                    className={cn(inputCls, "dark-scheme appearance-none")}
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>التاريخ</Label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) => patch({ date: e.target.value || data.date })}
                    className={cn(inputCls, "dark-scheme")}
                  />
                </div>
              </div>

              <div>
                <Label>التقدير</Label>
                <div className="grid grid-cols-4 gap-2">
                  {APPRECIATIONS.map((a) => (
                    <button
                      key={a}
                      onClick={() => patch({ appreciation: a })}
                      className={cn(
                        "rounded-md border px-1 py-2 font-cairo text-[12px] font-bold transition active:scale-95",
                        data.appreciation === a
                          ? "border-gold/70 bg-gold/15 text-gold-bright"
                          : "border-white/10 bg-[#0c211a] text-moss hover:border-gold/30 hover:text-cream"
                      )}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>مجموع الدرجات (اختياري)</Label>
                  <input
                    value={data.score}
                    onChange={(e) => patch({ score: e.target.value.replace(/[^\d.]/g, "").slice(0, 6) })}
                    inputMode="decimal"
                    placeholder="مثال: 97.5"
                    className={inputCls}
                  />
                </div>
                <div>
                  <Label>رقم الشهادة</Label>
                  <div className="flex gap-1.5">
                    <input
                      value={data.serial}
                      readOnly
                      dir="ltr"
                      className={cn(inputCls, "text-center text-xs font-bold tracking-wider text-moss")}
                    />
                    <button
                      onClick={() => patch({ serial: newSerial() })}
                      aria-label="توليد رقم جديد"
                      title="توليد رقم جديد"
                      className="flex w-11 shrink-0 items-center justify-center rounded-md border border-white/10 bg-[#0c211a] text-moss transition hover:border-gold/40 hover:text-gold active:scale-95"
                    >
                      <IconRefresh />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <Label>نص الشهادة</Label>
                <textarea
                  value={data.note}
                  onChange={(e) => patch({ note: e.target.value })}
                  rows={4}
                  className={cn(inputCls, "resize-none font-naskh text-[15px] leading-relaxed")}
                />
                <div className="mt-1 font-cairo text-[11px] text-moss/60">
                  يتغيّر النص تلقائيًا مع نوع الشهادة والنوع (طالب/طالبة) ويمكنك تعديله بحرية
                </div>
              </div>

              <button
                onClick={download}
                disabled={exporting}
                className={cn(
                  "mt-1 flex w-full items-center justify-center gap-2.5 rounded-lg py-3.5 font-cairo text-base font-black transition active:scale-[.98]",
                  exporting
                    ? "cursor-wait bg-gold/60 text-night"
                    : "bg-gradient-to-l from-[#e6cd7c] via-gold to-[#a8842a] text-night shadow-[0_10px_30px_-8px_rgba(201,169,79,.55)] hover:brightness-110"
                )}
              >
                {exporting ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-night/30 border-t-night" />
                    جارٍ توليد الصورة…
                  </>
                ) : (
                  <>
                    <IconDownload />
                    تحميل الشهادة PNG
                  </>
                )}
              </button>
              {!nameValid && (
                <div className="-mt-2 text-center font-cairo text-[11px] font-bold text-gold/80">
                  اكتب اسم الطالب (حرفان على الأقل) لتفعيل التحميل
                </div>
              )}
            </div>
          </aside>

          {/* ---------- preview column ---------- */}
          <section className="animate-fade-up min-w-0" style={{ animationDelay: "0.1s" }}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 font-cairo text-sm font-extrabold text-cream">
                <span className="blink-dot h-2.5 w-2.5 rounded-full bg-[#7fbf8f]" />
                معاينة حية
                <span className="hidden rounded-full border border-white/10 bg-pine px-2.5 py-0.5 text-[11px] font-bold text-moss sm:inline">
                  PNG · {toArabicDigits(2480)}×{toArabicDigits(1748)} بكسل
                </span>
              </div>
              <div className="flex overflow-hidden rounded-md border border-white/10">
                {(
                  [
                    { id: "fit", label: "ملاءمة الشاشة" },
                    { id: "full", label: "الحجم الكامل" },
                  ] as { id: "fit" | "full"; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setFitMode(m.id)}
                    className={cn(
                      "px-3.5 py-1.5 font-cairo text-xs font-bold transition",
                      fitMode === m.id ? "bg-gold/20 text-gold-bright" : "bg-pine text-moss hover:text-cream"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={wrapRef}
              className={cn(
                "relative rounded-xl border border-white/10 bg-[#081711]/80 p-4 shadow-[inset_0_0_60px_rgba(0,0,0,.45)]",
                fitMode === "full" && "overflow-x-auto"
              )}
            >
              <div
                className="relative mx-auto transition-all duration-200"
                style={{ width: CERT_W * scale, height: CERT_H * scale }}
              >
                <div
                  className="absolute top-0 right-0 shadow-[0_35px_90px_-25px_rgba(0,0,0,.85)]"
                  style={{ transform: `scale(${scale})`, transformOrigin: "top right" }}
                >
                  <Certificate ref={certRef} data={data} staticMode={exporting} />
                </div>
              </div>
            </div>

            <HistoryList
              items={history}
              onLoad={loadFromHistory}
              onDelete={(id) => setHistory((h) => h.filter((x) => x.id !== id))}
              onClear={() => {
                setHistory([]);
                showToast("تم مسح سجل الشهادات", "success");
              }}
            />
          </section>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-1.5 border-t border-white/5 py-6 text-center">
          <div className="font-ruqaa text-xl text-gold/80">﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾</div>
          <div className="font-cairo text-xs text-moss/70">
            مولِّد شهادات أ/ محمد عيسى — مُدرِّس اللغة العربية · تُحفظ البيانات على هذا الجهاز فقط
          </div>
        </footer>
      </main>

      {/* toast */}
      {toast && (
        <div
          key={toast.key}
          className={cn(
            "animate-pop fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border px-5 py-3 font-cairo text-sm font-bold shadow-2xl",
            toast.kind === "success"
              ? "border-[#7fbf8f]/50 bg-[#12291f] text-[#a8d8b4]"
              : "border-danger/50 bg-[#2b1712] text-[#f0b3a8]"
          )}
        >
          {toast.kind === "success" ? <IconCheck /> : <IconAlert />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
