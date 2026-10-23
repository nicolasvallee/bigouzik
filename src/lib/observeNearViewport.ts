export function observeNearViewport(element: Element, initialize: () => void) {
  if (typeof IntersectionObserver === 'undefined') {
    initialize()
    return () => {}
  }

  let active = true
  const observer = new IntersectionObserver((entries) => {
    if (!active || !entries.some(entry => entry.isIntersecting)) return
    stop()
    initialize()
  }, { rootMargin: '400px 0px' })

  function stop() {
    active = false
    observer.disconnect()
  }

  observer.observe(element)
  return stop
}
