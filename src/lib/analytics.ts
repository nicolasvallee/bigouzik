type EventData = Record<string, string | number | boolean>

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => Promise<unknown> | void }
  }
}

export function trackEvent(name: string, data?: EventData) {
  // Analytics failures must never interrupt playback or controls.
  try {
    void Promise.resolve(window.umami?.track(name, data)).catch(() => {})
  } catch {}
}
