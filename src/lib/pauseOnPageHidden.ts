export function pauseOnPageHidden(pause: () => void) {
  const onVisibilityChange = () => {
    if (document.hidden) pause()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)
  return () => document.removeEventListener('visibilitychange', onVisibilityChange)
}
