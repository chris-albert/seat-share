"use client";

import { useFormStatus } from "react-dom";

/**
 * A submit button that knows when its parent <form action> is running: it disables
 * itself and shows a spinner so it's obvious the click registered. Drop-in for any
 * <button> inside a server-action form.
 */
export function SubmitButton({
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending || undefined}
      className={`relative ${className}`}
    >
      <span className={pending ? "invisible" : undefined}>{children}</span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        </span>
      )}
    </button>
  );
}
