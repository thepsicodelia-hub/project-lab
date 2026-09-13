export const BRAND_ACCENT = "#d7ee78";

/** Original interlocking P/L frame: production and lab, one continuous workspace. */
export function brandLockup() {
  return `<span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 64 64" fill="currentColor"><path d="M10 8h27c10.5 0 19 8.5 19 19v13H43V27a6 6 0 0 0-6-6H23v27H10V8Z"/><path d="M29 29h13v14h14v13H29V29Z"/></svg></span><span class="brand-wordmark">project<span>lab</span><small>Production workspace</small></span>`;
}
