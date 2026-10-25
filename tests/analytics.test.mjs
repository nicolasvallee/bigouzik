import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { trackEvent } from '../src/lib/analytics.ts'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
  else delete globalThis.window
})

test('forwards event properties without converting numbers or booleans', () => {
  const calls = []
  globalThis.window = { umami: { track: (...args) => calls.push(args) } }
  trackEvent('view_toggle', { group: 'rio', view: 'sheet', enabled: true })
  trackEvent('speed_change', { group: 'rio', speed: 0.8 })
  assert.deepEqual(calls, [
    ['view_toggle', { group: 'rio', view: 'sheet', enabled: true }],
    ['speed_change', { group: 'rio', speed: 0.8 }],
  ])
})

test('missing or blocked analytics does not interrupt the caller', () => {
  globalThis.window = {}
  assert.doesNotThrow(() => trackEvent('track_play'))
  globalThis.window.umami = { track: () => { throw new Error('blocked') } }
  assert.doesNotThrow(() => trackEvent('track_play'))
})

test('rejected tracking requests do not create unhandled rejections', async () => {
  globalThis.window = { umami: { track: () => Promise.reject(new Error('offline')) } }
  trackEvent('track_play')
  await new Promise(resolve => setImmediate(resolve))
})
