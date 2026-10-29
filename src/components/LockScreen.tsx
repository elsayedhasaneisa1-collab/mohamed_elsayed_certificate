import { useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";
import { getPinHash, hashPin, setPinHash } from "../lib/store";
import TeacherPhoto from "./TeacherPhoto";

type Tab = "pin" | "finger" | "face";
type PinPhase = "setup1" | "setup2" | "login";

interface Props {
  onUnlock: () => void;
}

const PIN_LEN = 4;

/* ---------------- icons ---------------- */

const IconKey = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.9 12.1 20 3m-4 1 3 3m-6 0 2 2" />
  </svg>
);

const IconFinger = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={className}>
    <path d="M22 56c0-16-1-24 10-24s10 9 10 20" />
    <path d="M15 50c0-18 5-30 17-30s17 10 17 25" />
    <path d="M29 56c0-11 0-15 3-15s3 4 3 13" />
    <path d="M32 12c-15 0-25 12-25 32" />
    <path d="M32 12c15 0 25 12 25 30" />
    <path d="M32 4c4 0 8 .7 11.5 2" />
  </svg>
);

const IconFace = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    <path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" />
    <path d="M9 14.5c.8.9 1.8 1.4 3 1.4s2.2-.5 3-1.4" />
  </svg>
);

const IconBackspace = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M8.4 5h11.1a1.5 1.5 0 0 1 1.5 1.5v11a1.5 1.5 0 0 1-1.5 1.5H8.4a1.5 1.5 0 0 1-1.2-.6L3 12l4.2-6.4a1.5 1.5 0 0 1 1.2-.6Z" />
    <path d="m11.5 9.5 5 5m0-5-5 5" />
  </svg>
);

const IconCheck = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

const IconLockOpen = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="4" y="10" width="16" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 7.8-1.3" />
    <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const IconCamera = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 8h2.2a1 1 0 0 0 .8-.4L8.4 6a1.6 1.6 0 0 1 1.3-.7h4.6a1.6 1.6 0 0 1 1.3.7l1.4 1.6a1 1 0 0 0 .8.4H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
    <circle cx="12" cy="13.5" r="3.6" />
  </svg>
);

/* ---------------- PIN tab ---------------- */

function PinPad({ onUnlock }: { onUnlock: () => void }) {
  const [phase, setPhase] = useState<PinPhase>(() => (getPinHash() ? "login" : "setup1"));
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const [ok, setOk] = useState(false);
  const busy = useRef(false);

  const titles: Record<PinPhase, { main: string; sub: string }> = {
    setup1: { main: "أنشئ رمز القفل", sub: "اختر رمزًا من ٤ أرقام لحفظ شهاداتك" },
    setup2: { main: "أكِّد الرمز", sub: "أعد كتابة الرمز مرة أخرى للتأكيد" },
    login: { main: "أدخل رمز القفل", sub: "الصفحة مقفلة — أدخل الرمز للمتابعة" },
  };

  const fail = (msg: string) => {
    setError(msg);
    setPin("");
    setShakeKey((k) => k + 1);
  };

  const succeed = () => {
    setOk(true);
    setError("");
    window.setTimeout(onUnlock, 650);
  };

  const press = (digit: string) => {
    if (ok || busy.current || pin.length >= PIN_LEN) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length < PIN_LEN) return;

    busy.current = true;
    window.setTimeout(() => {
      busy.current = false;
      if (phase === "setup1") {
        setFirstPin(next);
        setPin("");
        setPhase("setup2");
      } else if (phase === "setup2") {
        if (next === firstPin) {
          setPinHash(hashPin(next));
          succeed();
        } else {
          setPhase("setup1");
          fail("الرمزان غير متطابقين — حاول مجددًا");
        }
      } else {
        if (hashPin(next) === getPinHash()) {
          succeed();
        } else {
          fail("رمز غير صحيح، حاول مرة أخرى");
        }
      }
    }, 260);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

  return (
    <div className="flex flex-col items-center">
      <div className="mb-1 text-center">
        <div className="font-cairo text-lg font-bold text-cream">{titles[phase].main}</div>
        <div className="mt-0.5 font-cairo text-xs text-moss">{titles[phase].sub}</div>
      </div>

      <div key={shakeKey} className={cn("mt-4 flex items-center gap-3.5", shakeKey > 0 && "animate-shake")}>
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-4 w-4 rounded-full border transition-all duration-200",
              i < pin.length
                ? ok
                  ? "scale-110 border-[#7fbf8f] bg-[#7fbf8f]"
                  : "scale-110 border-gold bg-gold shadow-[0_0_12px_rgba(201,169,79,.6)]"
                : "border-gold/40 bg-transparent"
            )}
          />
        ))}
      </div>

      {ok ? (
        <div className="mt-5 flex animate-pop items-center gap-2 text-[#7fbf8f]">
          <IconLockOpen className="h-6 w-6" />
          <span className="font-cairo text-sm font-bold">تم الفتح — أهلًا بك أستاذنا</span>
        </div>
      ) : (
        <div className={cn("mt-5 grid w-full max-w-[264px] grid-cols-3 gap-2.5")}>
          {keys.map((k) =>
            k === "clear" ? (
              <button
                key={k}
                onClick={() => {
                  setPin("");
                  setError("");
                }}
                className="aspect-square rounded-md border border-white/5 bg-pine-2/70 font-cairo text-sm font-semibold text-moss transition hover:bg-pine-3 hover:text-cream active:scale-90"
              >
                مسح
              </button>
            ) : k === "back" ? (
              <button
                key={k}
                onClick={() => setPin((p) => p.slice(0, -1))}
                aria-label="حذف رقم"
                className="flex aspect-square items-center justify-center rounded-md border border-white/5 bg-pine-2/70 text-moss transition hover:bg-pine-3 hover:text-cream active:scale-90"
              >
                <IconBackspace className="h-5 w-5 -scale-x-100" />
              </button>
            ) : (
              <button
                key={k}
                onClick={() => press(k)}
                className="aspect-square rounded-md border border-white/5 bg-pine-2 font-cairo text-xl font-bold text-cream shadow-[inset_0_1px_0_rgba(255,255,255,.05)] transition hover:border-gold/30 hover:bg-pine-3 active:scale-90"
              >
                {k}
              </button>
            )
          )}
        </div>
      )}

      <div className="mt-4 h-5 font-cairo text-xs font-semibold text-danger">{error}</div>
      <div className="mt-1 font-cairo text-[11px] text-moss/70">
        {phase === "login" ? "سيُستخدم هذا الرمز أيضًا لتفعيل البصمة والوجه" : "يُحفظ الرمز على هذا الجهاز فقط"}
      </div>
    </div>
  );
}

/* ---------------- Fingerprint tab ---------------- */

function FingerTab({ onUnlock }: { onUnlock: () => void }) {
  const hasPin = !!getPinHash();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [touching, setTouching] = useState(false);
  const raf = useRef<number>(0);
  const start = useRef(0);
  const DURATION = 1700;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const stop = () => {
    setTouching(false);
    cancelAnimationFrame(raf.current);
    const decay = () => {
      setProgress((p) => {
        const n = Math.max(0, p - 0.07);
        if (n > 0) raf.current = requestAnimationFrame(decay);
        return n;
      });
    };
    raf.current = requestAnimationFrame(decay);
  };

  const begin = (e: React.PointerEvent) => {
    if (!hasPin || done) return;
    e.preventDefault();
    setTouching(true);
    cancelAnimationFrame(raf.current);
    start.current = performance.now() - progress * DURATION;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start.current) / DURATION);
      setProgress(p);
      if (p >= 1) {
        setDone(true);
        setTouching(false);
        window.setTimeout(onUnlock, 750);
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  if (!hasPin) return <NoBiometric label="البصمة" />;

  const R = 66;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col items-center">
      {done ? (
        <div className="flex animate-pop flex-col items-center gap-3 py-8 text-[#7fbf8f]">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7fbf8f]/50 bg-[#7fbf8f]/10">
            <IconCheck className="h-8 w-8" />
          </span>
          <span className="font-cairo text-sm font-bold">تطابقت البصمة — جارٍ الفتح</span>
        </div>
      ) : (
        <>
          <div
            onPointerDown={begin}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
            className={cn(
              "relative mt-2 flex h-44 w-44 select-none items-center justify-center rounded-full transition-transform",
              touching ? "scale-95" : "hover:scale-[1.03]"
            )}
            style={{ touchAction: "none", cursor: "pointer" }}
          >
            <span className={cn("absolute inset-4 rounded-full", touching && "animate-ring-pulse")} />
            <svg viewBox="0 0 150 150" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="75" cy="75" r={R} fill="none" stroke="#244436" strokeWidth="4" />
              <circle
                cx="75"
                cy="75"
                r={R}
                fill="none"
                stroke="#c9a94f"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: "stroke-dashoffset 60ms linear" }}
              />
            </svg>
            <span
              className={cn(
                "flex h-28 w-28 items-center justify-center rounded-full border transition-colors",
                touching ? "border-gold/60 bg-gold/10 text-gold-bright" : "border-gold/25 bg-pine-2 text-gold"
              )}
            >
              <IconFinger className="h-14 w-14" />
            </span>
          </div>
          <div className="mt-4 font-cairo text-sm font-bold text-cream">
            {progress > 0 ? `جارٍ المسح… ${Math.round(progress * 100)}٪` : "اضغط مطوّلًا على البصمة"}
          </div>
          <div className="mt-1 font-cairo text-[11px] text-moss/70">أبقِ إصبعك ثابتًا حتى يكتمل المسح</div>
        </>
      )}
    </div>
  );
}

/* ---------------- Face tab ---------------- */

function FaceTab({ onUnlock }: { onUnlock: () => void }) {
  const hasPin = !!getPinHash();
  const [state, setState] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timer = useRef<number>(0);

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(
    () => () => {
      stopCam();
      window.clearTimeout(timer.current);
    },
    []
  );

  const startScan = async () => {
    setState("scanning");
    setErrMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 600 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      timer.current = window.setTimeout(() => {
        stopCam();
        setState("success");
        window.setTimeout(onUnlock, 850);
      }, 2700);
    } catch {
      stopCam();
      setState("error");
      setErrMsg("تعذَّر الوصول إلى الكاميرا — تحقَّق من الأذونات أو استخدم رمز القفل");
    }
  };

  if (!hasPin) return <NoBiometric label="الوجه" />;

  return (
    <div className="flex flex-col items-center">
      {state === "success" ? (
        <div className="flex animate-pop flex-col items-center gap-3 py-8 text-[#7fbf8f]">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#7fbf8f]/50 bg-[#7fbf8f]/10">
            <IconCheck className="h-8 w-8" />
          </span>
          <span className="font-cairo text-sm font-bold">تم التعرّف على الوجه — جارٍ الفتح</span>
        </div>
      ) : state === "scanning" || state === "error" ? (
        <div className="flex flex-col items-center">
          <div className="relative h-[300px] w-[236px] overflow-hidden rounded-lg border border-gold/40 bg-black">
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            {state === "scanning" && (
              <>
                <svg viewBox="0 0 236 300" className="absolute inset-0 h-full w-full text-gold-bright">
                  <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M14 40V22a8 8 0 0 1 8-8h18" />
                    <path d="M196 14h18a8 8 0 0 1 8 8v18" />
                    <path d="M222 260v18a8 8 0 0 1-8 8h-18" />
                    <path d="M40 286H22a8 8 0 0 1-8-8v-18" />
                  </g>
                  <ellipse cx="118" cy="140" rx="62" ry="84" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="7 7" opacity="0.75" />
                </svg>
                <div className="animate-scan absolute right-3 left-3 h-[3px] rounded-full bg-gold-bright shadow-[0_0_16px_2px_rgba(230,205,124,.8)]" />
                <div className="absolute bottom-2.5 right-0 left-0 text-center font-cairo text-xs font-bold text-gold-bright drop-shadow">
                  جارٍ التعرّف على الوجه…
                </div>
              </>
            )}
          </div>
          {state === "error" && (
            <>
              <div className="mt-3 max-w-[250px] text-center font-cairo text-xs font-semibold leading-relaxed text-danger">{errMsg}</div>
              <button
                onClick={() => setState("idle")}
                className="mt-3 rounded-md border border-gold/40 px-4 py-1.5 font-cairo text-xs font-bold text-gold transition hover:bg-gold/10"
              >
                المحاولة مرة أخرى
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center py-3">
          <span className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/25 bg-pine-2 text-gold">
            <IconFace className="h-12 w-12" />
          </span>
          <button
            onClick={startScan}
            className="mt-5 flex items-center gap-2 rounded-md bg-gold px-6 py-2.5 font-cairo text-sm font-extrabold text-night shadow-lg transition hover:bg-gold-bright active:scale-95"
          >
            <IconCamera className="h-5 w-5" />
            بدء مسح الوجه
          </button>
          <div className="mt-3 font-cairo text-[11px] text-moss/70">ستُفتح الكاميرا للتحقق ثم تُغلق مباشرة</div>
        </div>
      )}
    </div>
  );
}

function NoBiometric({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/20 bg-pine-2 text-moss">
        <IconFace className="h-8 w-8" />
      </span>
      <p className="max-w-[240px] font-cairo text-sm leading-relaxed text-moss">
        التحقق بـ{label} يتطلّب إنشاء رمز القفل (PIN) أولًا — يُستخدم الرمز كمرجع أمان أساسي.
      </p>
    </div>
  );
}

/* ---------------- Lock screen shell ---------------- */

export default function LockScreen({ onUnlock }: Props) {
  const [tab, setTab] = useState<Tab>("pin");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "pin", label: "رمز PIN", icon: <IconKey className="h-4.5 w-4.5" /> },
    { id: "finger", label: "البصمة", icon: <IconFinger className="h-4.5 w-4.5" /> },
    { id: "face", label: "الوجه", icon: <IconFace className="h-4.5 w-4.5" /> },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 py-10">
      {/* rotating octagram backdrop */}
      <svg viewBox="0 0 900 900" className="animate-spin-slow pointer-events-none absolute top-1/2 left-1/2 h-[1100px] w-[1100px] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.05]">
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="180" y="180" width="540" height="540" />
          <rect x="180" y="180" width="540" height="540" transform="rotate(45 450 450)" />
          <circle cx="450" cy="450" r="330" />
          <circle cx="450" cy="450" r="200" />
        </g>
      </svg>
      <div className="animate-floaty pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-gold/[0.07] blur-3xl" />
      <div className="animate-floaty pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-[#1d6b45]/20 blur-3xl" style={{ animationDelay: "-4.5s" }} />

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* branding */}
        <div className="animate-fade-up text-center lg:text-right">
          <div className="flex flex-col items-center gap-5 lg:flex-row">
            <div className="relative shrink-0">
              <span className="animate-ring-pulse absolute inset-0 rounded-full" />
              <TeacherPhoto className="relative h-24 w-24 ring-2 ring-gold/70 ring-offset-4 ring-offset-night" />
            </div>
            <div>
              <div className="font-cairo text-[13px] font-bold tracking-[0.35em] text-gold">بوابة موثَّقة · دخول مقيَّد</div>
              <h1 className="mt-1 font-ruqaa text-5xl leading-[1.15] text-cream md:text-6xl">
                الأستاذ / محمد عيسى
              </h1>
              <div className="mt-1 font-naskh text-2xl text-moss">مُدرِّس اللغة العربية</div>
            </div>
          </div>

          <div className="mx-auto mt-6 flex max-w-md items-center gap-3 lg:mx-0">
            <span className="h-px flex-1 bg-gradient-to-l from-gold/60 to-transparent" />
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-gold">
              <rect x="5" y="5" width="10" height="10" transform="rotate(45 10 10)" fill="currentColor" />
            </svg>
            <span className="h-px flex-1 bg-gradient-to-r from-gold/60 to-transparent" />
          </div>

          <p className="mx-auto mt-5 max-w-md font-cairo text-sm leading-relaxed text-[#b9c7bb] lg:mx-0">
            أنشئ شهادات تقدير وتفوق لطلابك بتصميمٍ فاخر وتوقيعٍ معتمد، ثم حمِّلها بجودة طباعة عالية
            بصيغة PNG — كل ذلك خلف قفلٍ آمن لا يفتحه غيرك.
          </p>

          <ul className="mt-6 hidden gap-3 lg:flex lg:flex-col">
            {[
              "شهادات بمقاس A4 بجودة 2480×1748 بكسل",
              "ختمٌ ذهبي وتوقيع ورقم تسلسلي لكل شهادة",
              "سجلٌّ محفوظ للشهادات الصادرة على هذا الجهاز",
            ].map((t, i) => (
              <li key={i} className="flex items-center gap-3 font-cairo text-[13px] text-moss">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* unlock card */}
        <div className="animate-fade-up rounded-xl border border-gold/20 bg-gradient-to-b from-pine to-night p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)] md:p-8" style={{ animationDelay: "0.12s" }}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <circle cx="12" cy="15" r="1.4" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div>
              <div className="font-cairo text-base font-extrabold text-cream">فتح مولِّد الشهادات</div>
              <div className="font-cairo text-xs text-moss">اختر طريقة التحقق للمتابعة</div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-md border px-2 py-2.5 font-cairo text-[13px] font-bold transition",
                  tab === t.id
                    ? "border-gold/60 bg-gold/15 text-gold-bright shadow-[inset_0_0_20px_rgba(201,169,79,.08)]"
                    : "border-white/10 bg-white/[0.02] text-moss hover:border-gold/30 hover:text-cream"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-[380px]">
            {tab === "pin" && <PinPad onUnlock={onUnlock} />}
            {tab === "finger" && <FingerTab onUnlock={onUnlock} />}
            {tab === "face" && <FaceTab onUnlock={onUnlock} />}
          </div>
        </div>
      </div>
    </div>
  );
}
