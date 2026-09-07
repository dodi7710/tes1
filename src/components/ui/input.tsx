// Hallmark · component: input · design-system: design.md
// states: default · hover · focus · active · disabled · error (via aria-invalid)
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export const inputClasses =
  "w-full min-h-12 rounded-input border border-rule bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors duration-short ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:border-focus disabled:opacity-50 aria-[invalid=true]:border-danger";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref,
) {
  return <input ref={ref} className={`${inputClasses} ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return <textarea ref={ref} className={`${inputClasses} min-h-24 py-2.5 ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = "", ...props },
  ref,
) {
  return <select ref={ref} className={`${inputClasses} ${className}`} {...props} />;
});
