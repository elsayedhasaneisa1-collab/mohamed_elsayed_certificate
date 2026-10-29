import { forwardRef } from "react";
import type { CertData } from "../lib/store";
import { academicYear, formatCertDate, toArabicDigits } from "../lib/store";
import { getType } from "../data/presets";
import TeacherPhoto from "./TeacherPhoto";

export const CERT_W = 1240;
export const CERT_H = 874;

const GOLD = "#b98a2e";
const GOLD_BRIGHT = "#d4af37";
const EMERALD = "#144634";
const INK = "#22302a";

/* ---------- ornaments ---------- */

function starPoints(cx: number, cy: number, R: number, r: number, n: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const radius = i % 2 === 0 ? R : r;
    const a = (i * Math.PI) / n - Math.PI / 2;
    pts.push(`${(cx + radius * Math.cos(a)).toFixed(2)},${(cy + radius * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function Corner({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" style={style} className="pointer-events-none absolute">
      <g fill="none" stroke={GOLD}>
        <path d="M6 126 C6 60 60 6 126 6" strokeWidth="2.6" />
        <path d="M16 126 C16 66 66 16 126 16" strokeWidth="1" opacity="0.55" />
        <path d="M42 96 C52 74 74 52 96 42" strokeWidth="1.4" opacity="0.8" />
        <path d="M26 60 C34 44 44 34 60 26" strokeWidth="1.4" opacity="0.8" />
      </g>
      <path d="M6 6 L34 6 A28 28 0 0 0 6 34 Z" fill={GOLD} opacity="0.9" />
      <circle cx="14" cy="14" r="3.2" fill="#f8f1dd" />
      <circle cx="96" cy="42" r="3" fill={GOLD} />
      <circle cx="42" cy="96" r="3" fill={GOLD} />
      <circle cx="126" cy="6" r="2.4" fill={GOLD} />
      <circle cx="6" cy="126" r="2.4" fill={GOLD} />
    </svg>
  );
}

function TitleDivider() {
  return (
    <svg width="430" height="24" viewBox="0 0 430 24" className="mx-auto mt-1">
      <line x1="8" y1="12" x2="188" y2="12" stroke={GOLD} strokeWidth="1.6" />
      <line x1="242" y1="12" x2="422" y2="12" stroke={GOLD} strokeWidth="1.6" />
      <rect x="206" y="3" width="18" height="18" transform="rotate(45 215 12)" fill={GOLD_BRIGHT} stroke={GOLD} strokeWidth="1" />
      <rect x="210.5" y="7.5" width="9" height="9" transform="rotate(45 215 12)" fill="#f8f1dd" />
      <circle cx="188" cy="12" r="3" fill={GOLD} />
      <circle cx="242" cy="12" r="3" fill={GOLD} />
      <circle cx="8" cy="12" r="2" fill={GOLD} />
      <circle cx="422" cy="12" r="2" fill={GOLD} />
    </svg>
  );
}

function NameFlourish() {
  return (
    <svg width="340" height="26" viewBox="0 0 340 26" className="mx-auto -mt-1">
      <path d="M12 10 C70 22 120 22 166 13 C212 5 262 5 328 14" fill="none" stroke={GOLD_BRIGHT} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="163" y="6" width="13" height="13" transform="rotate(45 170 13)" fill="#f8f1dd" stroke={GOLD} strokeWidth="1.4" />
      <circle cx="12" cy="10" r="2.4" fill={GOLD} />
      <circle cx="328" cy="14" r="2.4" fill={GOLD} />
    </svg>
  );
}

function Rosette({ appreciation }: { appreciation: string }) {
  return (
    <svg width="158" height="186" viewBox="0 0 158 186">
      <defs>
        <linearGradient id="sealGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6cd7c" />
          <stop offset="0.5" stopColor="#c9a94f" />
          <stop offset="1" stopColor="#9a7a2c" />
        </linearGradient>
      </defs>
      {/* ribbons */}
      <path d="M58 128 L44 176 L64 164 L74 180 L84 136 Z" fill={EMERALD} />
      <path d="M100 128 L114 176 L94 164 L84 180 L74 136 Z" fill="#1b5a43" />
      {/* star seal */}
      <polygon points={starPoints(79, 79, 74, 62, 16)} fill="url(#sealGold)" stroke={GOLD} strokeWidth="1.5" />
      <circle cx="79" cy="79" r="50" fill="#f8f1dd" stroke={GOLD} strokeWidth="2" />
      <circle cx="79" cy="79" r="44" fill="none" stroke={GOLD} strokeWidth="0.8" strokeDasharray="3 3" />
      <text x="79" y="66" textAnchor="middle" fontFamily="Cairo, sans-serif" fontWeight="700" fontSize="13" fill="#8a6d2f">
        التقدير العام
      </text>
      <text x="79" y="98" textAnchor="middle" fontFamily="'Aref Ruqaa', serif" fontWeight="700" fontSize="26" fill={EMERALD}>
        {appreciation}
      </text>
    </svg>
  );
}

function Signature({ serial, staticMode }: { serial: string; staticMode?: boolean }) {
  return (
    <svg width="236" height="56" viewBox="0 0 236 56" className="mx-auto">
      <path
        key={serial}
        className={staticMode ? undefined : "animate-draw"}
        pathLength={staticMode ? undefined : 1}
        d="M8 38 C36 10 54 48 82 32 C102 20 112 42 136 30 C158 19 170 40 196 26 C210 19 222 24 228 20"
        fill="none"
        stroke={INK}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M36 48 C86 42 156 42 204 46" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- certificate ---------- */

interface Props {
  data: CertData;
  /** عند التصدير تُعطَّل الحركات لضمان ظهور كل العناصر في الصورة */
  staticMode?: boolean;
}

const Certificate = forwardRef<HTMLDivElement, Props>(({ data, staticMode }, ref) => {
  const type = getType(data.type);
  const isMale = data.gender === "male";
  const name = data.studentName.trim();
  const nameSize = name.length > 24 ? 34 : name.length > 15 ? 42 : 50;

  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        width: CERT_W,
        height: CERT_H,
        position: "relative",
        background: "#f8f1dd",
        fontFamily: "'Amiri', serif",
        color: INK,
        overflow: "hidden",
      }}
    >
      {/* paper lattice */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23144634' stroke-opacity='0.055' stroke-width='1'%3E%3Cpath d='M42 8l8.4 25.6L76 42l-25.6 8.4L42 76l-8.4-25.6L8 42l25.6-8.4z'/%3E%3Ccircle cx='42' cy='42' r='4.5'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      {/* watermark */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-7deg)",
          fontFamily: "'Aref Ruqaa', serif",
          fontSize: 200,
          fontWeight: 700,
          color: EMERALD,
          opacity: 0.045,
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        محمد عيسى
      </div>
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(122,94,34,0.14) 100%)",
        }}
      />

      {/* border band */}
      <div style={{ position: "absolute", inset: 0, border: `16px solid ${EMERALD}` }} />
      <div style={{ position: "absolute", inset: 16, border: `2px solid ${GOLD_BRIGHT}` }} />
      <div style={{ position: "absolute", inset: 23, border: `1px solid ${GOLD}`, opacity: 0.6 }} />

      {/* corners */}
      <Corner style={{ top: 30, right: 30 }} />
      <Corner style={{ top: 30, left: 30, transform: "scaleX(-1)" }} />
      <Corner style={{ bottom: 30, right: 30, transform: "scaleY(-1)" }} />
      <Corner style={{ bottom: 30, left: 30, transform: "scale(-1)" }} />

      {/* content */}
      <div style={{ position: "absolute", inset: 34, display: "flex", flexDirection: "column" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 56px 0" }}>
          <div style={{ width: 240 }}>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#8a6d2f" }}>
              رقم الشهادة
            </div>
            <div dir="ltr" style={{ fontFamily: "'Cairo', sans-serif", fontSize: 15, fontWeight: 800, color: EMERALD, letterSpacing: 1.5 }}>
              {data.serial}
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 25, color: EMERALD, fontWeight: 700 }}>﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾</div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 11, color: "#8a6d2f", fontWeight: 600, marginTop: 2 }}>
              سورة طه — الآية ١١٤
            </div>
          </div>

          <div style={{ width: 240, textAlign: "left" }}>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#8a6d2f" }}>
              العام الدراسي
            </div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 15, fontWeight: 800, color: EMERALD }}>
              {academicYear(data.date)}
            </div>
          </div>
        </div>

        {/* title */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{ fontFamily: "'Aref Ruqaa', serif", fontWeight: 700, fontSize: 66, color: EMERALD, lineHeight: 1.25 }}>
            {type.title}
          </div>
          <TitleDivider />
        </div>

        {/* recipient */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 23, color: "#54655a" }}>
            تُمنح هذه الشهادة إلى {isMale ? "الطالب" : "الطالبة"}
          </div>
          <div
            style={{
              fontFamily: "'Amiri', serif",
              fontWeight: 700,
              fontSize: nameSize,
              color: "#1c2b24",
              lineHeight: 1.5,
              marginTop: 2,
            }}
          >
            {name || (
              <span style={{ color: "#9aa79c", letterSpacing: 6 }}>………………………………</span>
            )}
          </div>
          <NameFlourish />
          <div style={{ fontSize: 22, color: "#43554a", marginTop: 2 }}>
            المقيَّد{isMale ? "" : "ة"} بالصف: <b style={{ color: INK }}>{data.grade}</b>
            {data.score.trim() && (
              <span>
                {" "}
                — بمجموع درجات: <b style={{ color: EMERALD }}>{toArabicDigits(data.score)}</b>
              </span>
            )}
          </div>
        </div>

        {/* note */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 110px 0",
          }}
        >
          <p style={{ fontSize: 24, lineHeight: 2.05, color: "#37473d", textAlign: "center", maxWidth: 900 }}>
            {data.note}
          </p>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: "0 64px 26px",
          }}
        >
          {/* signature */}
          <div style={{ width: 300, textAlign: "center" }}>
            <Signature serial={data.serial} staticMode={staticMode} />
            <div style={{ fontFamily: "'Aref Ruqaa', serif", fontSize: 28, color: EMERALD, marginTop: 2 }}>
              أ / محمد عيسى
            </div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, color: "#6b7a6f", marginTop: 2 }}>
              التوقيع — مُدرِّس اللغة العربية
            </div>
          </div>

          {/* seal + date */}
          <div style={{ textAlign: "center" }}>
            <Rosette appreciation={data.appreciation} />
            <div style={{ fontSize: 21, color: "#37473d", marginTop: 6 }}>{formatCertDate(data.date)}</div>
          </div>

          {/* teacher photo */}
          <div style={{ width: 300, textAlign: "center" }}>
            <div
              style={{
                width: 118,
                height: 118,
                margin: "0 auto",
                borderRadius: "50%",
                padding: 5,
                background: `linear-gradient(135deg, ${GOLD_BRIGHT}, ${GOLD})`,
              }}
            >
              <TeacherPhoto className="h-full w-full ring-4 ring-[#f8f1dd]" />
            </div>
            <div style={{ fontFamily: "'Aref Ruqaa', serif", fontSize: 22, color: EMERALD, marginTop: 6 }}>
              الأستاذ / محمد عيسى
            </div>
            <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 12, fontWeight: 700, color: "#6b7a6f", marginTop: 1 }}>
              مُدرِّس اللغة العربية
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Certificate.displayName = "Certificate";
export default Certificate;
