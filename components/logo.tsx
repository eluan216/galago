/**
 * Galago mark — consistent bushbaby everywhere
 * Lime iris (#c8f51b) on dark eyes, soft grey body.
 * Same SVG used on landing, nav, sign-in, sign-up, dashboard.
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
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Ears */}
      <ellipse
        cx="42"
        cy="48"
        rx="20"
        ry="34"
        fill="#6a6f82"
        transform="rotate(-18 42 48)"
      />
      <ellipse
        cx="158"
        cy="48"
        rx="20"
        ry="34"
        fill="#6a6f82"
        transform="rotate(18 158 48)"
      />
      <ellipse
        cx="42"
        cy="50"
        rx="10"
        ry="24"
        fill="#d9b0a6"
        transform="rotate(-18 42 50)"
      />
      <ellipse
        cx="158"
        cy="50"
        rx="10"
        ry="24"
        fill="#d9b0a6"
        transform="rotate(18 158 50)"
      />
      {/* Head + muzzle */}
      <ellipse cx="100" cy="112" rx="72" ry="66" fill="#6a6f82" />
      <ellipse cx="100" cy="146" rx="30" ry="22" fill="#e6dccd" />
      <ellipse cx="100" cy="132" rx="7" ry="5" fill="#14161c" />
      {/* Eyes — lime iris (brand accent) */}
      <circle cx="66" cy="102" r="30" fill="#0a0b0f" />
      <circle cx="134" cy="102" r="30" fill="#0a0b0f" />
      <circle cx="66" cy="102" r="22" fill="#c8f51b" />
      <circle cx="134" cy="102" r="22" fill="#c8f51b" />
      <circle cx="66" cy="102" r="11" fill="#050506" />
      <circle cx="134" cy="102" r="11" fill="#050506" />
      <circle cx="72" cy="94" r="4" fill="#fff" />
      <circle cx="140" cy="94" r="4" fill="#fff" />
    </svg>
  );
}

export function GalagoWordmark({
  className = "",
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-tight ${className}`}
    >
      <GalagoMark className="w-11 h-11" />
      <span
        className={`text-[20px] leading-none ${
          light ? "text-[var(--ink)]" : "text-white"
        }`}
      >
        Galago
      </span>
    </span>
  );
}
