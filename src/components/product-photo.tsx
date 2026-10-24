import Image from "next/image";

/** Product thumbnail with a neutral placeholder when no photo is set (MENU-5). */
export default function ProductPhoto({
  src,
  alt,
  className = "",
  sizes = "96px",
}: {
  src: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    // White behind a real photo so a contained bottle blends into the white
    // card instead of sitting in a grey letterbox; grey only for the placeholder.
    <div className={`relative overflow-hidden ${src ? "bg-surface" : "bg-rule-2"} ${className}`}>
      {src ? (
        // Photos are already compressed on upload, so skip Vercel image optimization.
        // Contain, not cover: tall bottle cutouts must show whole, not cropped to the box.
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized className="object-contain" />
      ) : (
        <div aria-hidden className="absolute inset-0 grid place-items-center text-ink-3">
          <svg viewBox="0 0 24 24" className="w-1/3 max-w-8 h-auto" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.75" />
            <path d="m4 18 5-5 3 3 3-3 5 5" />
          </svg>
        </div>
      )}
    </div>
  );
}
