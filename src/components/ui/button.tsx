// Hallmark · component: button · design-system: design.md
// states: default · hover · focus · active · disabled · loading
"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { buttonClasses, type Size, type Variant } from "./button-classes";

// Re-exported so existing Client Component imports of `{ buttonClasses }`
// from "./button" keep working. Server Components must import it from
// "./button-classes" directly — see that file for why.
export { buttonClasses } from "./button-classes";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});

export default Button;

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
