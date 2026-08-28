"use client";

/**
 * List ⇄ calendar switch. Like the theme toggle, the choice lives in a `data-view`
 * attribute on <html> (restored pre-paint by the layout script) and CSS does the
 * showing/hiding via the `cal:` variant — so both views render on the server and
 * there's no hydration state.
 */
export function ViewToggle() {
  function set(view: "list" | "calendar") {
    document.documentElement.dataset.view = view;
    try {
      localStorage.setItem("view", view);
    } catch {}
  }

  const base = "rounded-md p-1.5 transition-colors";
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="View">
      <button
        type="button"
        onClick={() => set("list")}
        aria-label="List view"
        className={`${base} bg-fg text-bg cal:bg-transparent cal:text-muted cal:hover:text-fg`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => set("calendar")}
        aria-label="Calendar view"
        className={`${base} text-muted hover:text-fg cal:bg-fg cal:text-bg`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      </button>
    </div>
  );
}
