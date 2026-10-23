import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { Environment, Settings, midi, synth } from '@coderline/alphatab'

// Resolve the extensionless TypeScript imports used by Vite in Node's test runner.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('./') && context.parentURL?.endsWith('.ts')) {
      return nextResolve(`${specifier}.ts`, context)
    }
    return nextResolve(specifier, context)
  },
})
const { separatePercussionChannels, updatePercussionMute } = await import('../src/lib/percussionPlayback.ts')

function makeMidi() {
  const file = new midi.MidiFile()
  const track = new midi.MidiTrack()
  file.tracks.push(track)
  track.events.push(
    new midi.ControlChangeEvent(0, 0, 9, midi.ControllerType.VolumeCoarse, 100),
    new midi.ControlChangeEvent(0, 0, 9, midi.ControllerType.BankSelectCoarse, 0),
    new midi.ControlChangeEvent(0, 0, 9, midi.ControllerType.BankSelectFine, 0),
    new midi.ProgramChangeEvent(0, 0, 9, 0),
  )
  for (const [index, key] of [37, 38, 36, 43, 41, 65, 66, 67].entries()) {
    track.events.push(new midi.NoteOnEvent(0, index * 240, 9, key, 90))
    track.events.push(new midi.NoteOffEvent(0, index * 240 + 120, 9, key, 0))
  }
  return file
}

test('routes both note-on and note-off, preserves velocity/timing and initializes channels before the first hit', () => {
  const file = makeMidi()
  const originalNotes = file.tracks[0].events.filter(event => 'noteKey' in event)
  const before = originalNotes.map(({ tick, noteKey, noteVelocity, type }) => ({ tick, noteKey, noteVelocity, type }))
  separatePercussionChannels(file)
  assert.deepEqual(originalNotes.map(({ tick, noteKey, noteVelocity, type }) => ({ tick, noteKey, noteVelocity, type })), before)
  for (const note of originalNotes) {
    const expectedChannel = [37, 38].includes(note.noteKey) ? 0 : [36, 43, 41].includes(note.noteKey) ? 1 : 9
    assert.equal(note.channel, expectedChannel)
    const setup = file.tracks[0].events.findIndex(event => event.type === midi.MidiEventType.ProgramChange && event.channel === expectedChannel)
    assert.ok(setup < file.tracks[0].events.indexOf(note))
  }
})

function emitter() {
  const listeners = []
  return { on(listener) { listeners.push(listener) }, trigger(value) { for (const listener of listeners) listener(value) } }
}

test('channel separation preserves the waveform of the first surdo hit', () => {
  function renderFirstHit(separate, key) {
    const file = makeMidi()
    for (const event of file.tracks[0].events) {
      if ('noteKey' in event && event.noteKey === 37) event.noteKey = key
    }
    for (const event of file.tracks[0].events) {
      if (event.type === midi.MidiEventType.ProgramChange) event.program = 48
    }
    if (separate) separatePercussionChannels(file)
    const output = {
      sampleRate: 44100, ready: emitter(), sampleRequest: emitter(), samplesPlayed: emitter(),
      open() { this.ready.trigger() }, activate() {}, play() {}, pause() {}, resetSamples() {}, addSamples() {}, destroy() {},
    }
    const player = new synth.AlphaSynth(output, new Settings().player.bufferTimeInMilliseconds)
    player.loadMidiFile(file)
    player.loadSoundFont(new Uint8Array(readFileSync(new URL('../public/soundfont/GeneralUser-GS.sf2', import.meta.url))), false)
    for (const event of file.events) {
      if (event.tick === 0) player.synthesizer.processMidiMessage(event)
    }
    const samples = new Float32Array(8192)
    player.synthesizer.synthesize(samples, 0, 4096)
    player.destroy()
    return samples
  }
  for (const key of [36, 43, 41]) {
    const original = renderFirstHit(false, key)
    const separated = renderFirstHit(true, key)
    assert.ok(original.some(value => Math.abs(value) > 0.00001))
    const maximumDifference = original.reduce((maximum, value, index) => Math.max(maximum, Math.abs(value - separated[index])), 0)
    assert.ok(maximumDifference < 0.000001, `First hit for key ${key} changed by ${maximumDifference}`)
  }
})

test('real alphaTab synth loads drum samples on separated channels and keeps playing through rapid mute changes', () => {
  const output = {
    sampleRate: 44100, ready: emitter(), sampleRequest: emitter(), samplesPlayed: emitter(),
    open() { this.ready.trigger() }, activate() {}, play() {}, pause() {}, resetSamples() {}, addSamples() {}, destroy() {},
  }
  const player = new synth.AlphaSynth(output, new Settings().player.bufferTimeInMilliseconds)
  const file = makeMidi()
  separatePercussionChannels(file)
  player.loadMidiFile(file)
  player.loadSoundFont(new Uint8Array(readFileSync(new URL('../public/soundfont/GeneralUser-GS.sf2', import.meta.url))), false)
  assert.ok(player.isReadyForPlayback)
  assert.ok(player.play())
  player.timePosition = 250
  const position = player.timePosition
  let stateChanges = 0
  player.stateChanged.on(() => stateChanges++)
  stateChanges = 0
  for (let i = 0; i < 30; i++) {
    for (const selected of ['snare', 'kick', 'both']) {
      updatePercussionMute(player, selected)
      assert.equal(player.state, synth.PlayerState.Playing)
      assert.equal(player.timePosition, position)
      assert.equal(player.synthesizer._mutedChannels.has(0), selected === 'kick')
      assert.equal(player.synthesizer._mutedChannels.has(1), selected === 'snare')
      assert.equal(player.synthesizer._mutedChannels.has(9), selected !== 'both')
    }
  }
  assert.equal(stateChanges, 0)

  // Exercise alphaTab's actual SoundFont bank selection and sample synthesis.
  for (const event of file.tracks[0].events) {
    if (!('noteKey' in event)) player.synthesizer.processMidiMessage(event)
  }
  for (const selected of ['both', 'snare', 'kick']) {
    updatePercussionMute(player, selected)
    for (const [key, channel] of [[37, 0], [38, 0], [36, 1], [43, 1], [41, 1], [65, 9], [66, 9], [67, 9]]) {
      player.synthesizer.synthesizeSilent(4096)
      player.synthesizer.processMidiMessage(new midi.NoteOnEvent(0, 0, channel, key, 90))
      const preset = player.synthesizer.presets[player.synthesizer._channels.channelList[channel].presetIndex]
      assert.equal(preset.bank, 128, 'Must use drum samples rather than melodic instruments')
      const samples = new Float32Array(8192)
      player.synthesizer.synthesize(samples, 0, 4096)
      const audible = samples.some(value => Math.abs(value) > 0.00001)
      assert.equal(audible, selected === 'both' || (selected === 'snare' ? channel === 0 : channel === 1), `Unexpected sound for ${selected}, key ${key}, channel ${channel}`)
    }
  }
  player.pause()
  updatePercussionMute(player, 'both')
  assert.equal(player.state, synth.PlayerState.Paused)
  player.destroy()
})

test('the viewer buffer lets the real audio worklet request and output samples at phone sample rates', () => {
  const source = readFileSync(new URL('../src/components/MusicXmlViewer.vue', import.meta.url), 'utf8')
  const override = source.match(/bufferTimeInMilliseconds:\s*(\d+)/)
  const bufferTime = override ? Number(override[1]) : new Settings().player.bufferTimeInMilliseconds
  const previousGlobals = new Map(['AudioWorkletGlobalScope', 'AudioWorkletProcessor', 'registerProcessor', 'sampleRate'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  let Processor
  globalThis.AudioWorkletGlobalScope = class {}
  globalThis.AudioWorkletProcessor = class {
    messages = []
    port = { addEventListener() {}, start() {}, postMessage: message => this.messages.push(message) }
  }
  globalThis.registerProcessor = (_name, constructor) => { Processor = constructor }
  try {
    Environment.initializeAudioWorklet()
    for (const sampleRate of [44100, 48000]) {
      globalThis.sampleRate = sampleRate
      const stalled = new Processor({ processorOptions: { bufferTimeInMilliseconds: 100 } })
      stalled.process([], [[new Float32Array(128), new Float32Array(128)]], {})
      assert.equal(stalled.messages.some(message => message.cmd === 'alphaSynth.output.sampleRequest'), false, 'Reproduce the old 100ms buffer starvation')
      const processor = new Processor({ processorOptions: { bufferTimeInMilliseconds: bufferTime } })
      const channels = [new Float32Array(128), new Float32Array(128)]
      processor.process([], [channels], {})
      assert.ok(processor.messages.some(message => message.cmd === 'alphaSynth.output.sampleRequest'), `No audio requested at ${sampleRate}Hz with ${bufferTime}ms buffer`)
      processor._handleMessage({ data: { cmd: 'alphaSynth.output.addSamples', samples: new Float32Array(4096).fill(0.25) } })
      processor.process([], [channels], {})
      assert.ok(channels.every(channel => channel.some(value => value !== 0)))
    }
  } finally {
    for (const [key, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})
