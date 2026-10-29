import { useState } from "react";
import fallbackUrl from "../assets/mo-fallback.png";
import { cn } from "../utils/cn";

const primaryUrl = `${import.meta.env.BASE_URL}mo.png`;

interface Props {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

/**
 * يعرض صورة الأستاذ من المسار الرسمي mo.png (بدون خلفية)،
 * وإذا لم تُوجد الصورة يستخدم النسخة المدمجة تلقائيًا.
 */
export default function TeacherPhoto({ className, imgClassName, alt = "الأستاذ محمد عيسى" }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("overflow-hidden rounded-full bg-pine-2", className)}>
      <img
        src={failed ? fallbackUrl : primaryUrl}
        alt={alt}
        draggable={false}
        onError={() => setFailed(true)}
        className={cn("h-full w-full select-none object-cover", imgClassName)}
      />
    </div>
  );
}
