import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { observeNearViewport } from '../src/lib/observeNearViewport.ts'

const originalObserver = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver')
afterEach(() => {
  if (originalObserver) Object.defineProperty(globalThis, 'IntersectionObserver', originalObserver)
  else delete globalThis.IntersectionObserver
})

function mockObserver() {
  let observer
  globalThis.IntersectionObserver = class {
    disconnected = false
    constructor(callback, options) {
      this.callback = callback
      this.options = options
      observer = this
    }
    observe(element) { this.element = element }
    disconnect() { this.disconnected = true }
  }
  return () => observer
}

test('defers initialization until near the viewport and initializes only once', () => {
  const getObserver = mockObserver()
  const element = {}
  let starts = 0
  observeNearViewport(element, () => starts++)
  const observer = getObserver()
  assert.equal(observer.element, element)
  assert.equal(observer.options.rootMargin, '400px 0px')
  assert.equal(starts, 0)
  observer.callback([{ isIntersecting: false }])
  assert.equal(starts, 0)
  observer.callback([{ isIntersecting: true }])
  assert.equal(starts, 1)
  assert.ok(observer.disconnected)
  observer.callback([{ isIntersecting: true }])
  observer.callback([{ isIntersecting: false }])
  assert.equal(starts, 1)
})

test('unmounting before entry prevents initialization even with a queued notification', () => {
  const getObserver = mockObserver()
  let starts = 0
  const stop = observeNearViewport({}, () => starts++)
  stop()
  assert.ok(getObserver().disconnected)
  getObserver().callback([{ isIntersecting: true }])
  assert.equal(starts, 0)
})

test('falls back to immediate initialization when IntersectionObserver is unavailable', () => {
  delete globalThis.IntersectionObserver
  let starts = 0
  const stop = observeNearViewport({}, () => starts++)
  assert.equal(starts, 1)
  assert.doesNotThrow(stop)
})
