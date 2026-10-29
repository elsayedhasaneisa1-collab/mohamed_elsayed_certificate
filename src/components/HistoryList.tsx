import type { HistoryItem } from "../lib/store";
import { formatCertDate, toArabicDigits } from "../lib/store";
import { getType } from "../data/presets";
import { cn } from "../utils/cn";

interface Props {
  items: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

const IconRestore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2m-8.5 0 1 12A2 2 0 0 0 9.5 21h5a2 2 0 0 0 2-1.9l1-12.1M10 11v6m4-6v6" />
  </svg>
);

export default function HistoryList({ items, onLoad, onDelete, onClear }: Props) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 font-cairo text-base font-extrabold text-cream">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-gold/40 bg-gold/10 text-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
              <path d="M8 9h8M8 12.5h8M8 16h5" />
            </svg>
          </span>
          سجل الشهادات الصادرة
          <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-bold text-gold">
            {toArabicDigits(items.length)}
          </span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="font-cairo text-xs font-bold text-moss transition hover:text-danger"
          >
            مسح السجل
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 bg-pine/40 px-6 py-8 text-center font-cairo text-sm text-moss">
          لم تصدر أي شهادات بعد — حمِّل أول شهادة وسيظهر سجلها هنا تلقائيًا
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {items.map((item, i) => {
            const type = getType(item.data.type);
            return (
              <article
                key={item.id}
                className="animate-fade-up group w-[248px] shrink-0 rounded-lg border border-white/10 bg-gradient-to-b from-pine-2/80 to-pine p-4 transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,.6)]"
                style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-cairo text-[11px] font-bold text-gold">
                    {type.label}
                  </span>
                  <span className="font-cairo text-[10px] font-semibold tracking-wider text-moss/70" dir="ltr">
                    {item.data.serial}
                  </span>
                </div>
                <h3 className="mt-2.5 truncate font-naskh text-xl font-bold text-cream">
                  {item.data.studentName || "—"}
                </h3>
                <div className="mt-1 font-cairo text-[11px] text-moss">
                  {item.data.grade} · التقدير: {item.data.appreciation}
                </div>
                <div className="mt-0.5 font-cairo text-[11px] text-moss/70">{formatCertDate(item.data.date)}</div>
                <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
                  <button
                    onClick={() => onLoad(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 py-1.5 font-cairo text-xs font-bold text-gold transition hover:bg-gold/20 active:scale-95"
                  >
                    <IconRestore />
                    استرجاع
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    aria-label="حذف من السجل"
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-moss transition hover:border-danger/50 hover:text-danger active:scale-95"
                    )}
                  >
                    <IconTrash />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
