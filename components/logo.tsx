/**
 * Galago mark
 * -----------
 * Abstract bushbaby: two large nocturnal eyes + small body arc.
 * Gold iris on near-black — works as favicon-scale and header mark.
 * Not an owl. African, sharp, awake at night.
 */

export function GalagoMark({
  className = "w-8 h-8",
  title = "Galago",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Soft outer disc — night */}
      <circle cx="20" cy="20" r="19" fill="#0A0C10" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Left eye */}
      <ellipse cx="13.5" cy="18" rx="6.2" ry="7.2" fill="#F2F0EA" />
      <circle cx="14.2" cy="18.5" r="3.1" fill="#0A0C10" />
      <circle cx="15.1" cy="17.2" r="1.1" fill="#E8B923" />
      {/* Right eye */}
      <ellipse cx="26.5" cy="18" rx="6.2" ry="7.2" fill="#F2F0EA" />
      <circle cx="25.8" cy="18.5" r="3.1" fill="#0A0C10" />
      <circle cx="24.9" cy="17.2" r="1.1" fill="#E8B923" />
      {/* Small body / chin arc — agile, not heavy */}
      <path
        d="M12 28c2.5 3.5 13.5 3.5 16 0"
        stroke="#E8B923"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function GalagoWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <GalagoMark className="w-7 h-7" />
      <span className="text-[15px] font-medium tracking-tight text-moon">galago</span>
    </span>
  );
}
