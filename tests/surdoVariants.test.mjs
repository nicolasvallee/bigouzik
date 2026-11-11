import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as alphaTab from '@coderline/alphatab'
import ts from 'typescript'

// Exercise the viewer's functions without mounting an audio player.
const source = readFileSync(new URL('../src/components/MusicXmlViewer.vue', import.meta.url), 'utf8')
const functions = source.slice(source.indexOf('function getSurdoVariantRanges()'), source.indexOf('function seek('))
const constants = ts.transpileModule(readFileSync(new URL('../src/lib/percussion.ts', import.meta.url), 'utf8').replaceAll('export ', ''), {}).outputText
const createViewer = new Function('alphaTab', 'props', 'scoreTracks', 'surdoVariantRanges', 'DOMParser', 'XMLSerializer', ts.transpileModule(`
  ${constants}
  function scoreTrackKind() { return 'kick' }
  ${functions}
  return { addStackedSurdosToXml, getSurdoVariantRanges, positionStackedSurdos, colorSurdoVariants, applySurdoVariants }
`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText)

export function viewer(props, tracks = [], ranges = [], dom = {}) {
  return createViewer(alphaTab, props, tracks, ranges, dom.DOMParser, dom.XMLSerializer)
}

for (const keys of [[36], [43], [41], [36, 41], [43, 41], [36, 43], [36, 43, 41]]) {
  test(`keeps distinct colors and paired MIDI events for surdos ${keys.join('+')}`, () => {
    const beat = { absolutePlaybackStart: 100, notes: keys.map((_, index) => ({ percussionArticulation: index })) }
    // The original XML note is always 36; extra chord notes have their own instrument.
    const outputs = [36, ...keys.slice(1)]
    const track = {
      percussionArticulations: outputs.map(outputMidiNumber => ({ outputMidiNumber })),
      staves: [{ bars: [{ voices: [{ beats: [beat] }] }] }],
    }
    const ranges = keys.map(midiNote => ({ startTick: 100, endTick: 200, midiNote }))
    const api = viewer({}, [track], ranges)
    api.colorSurdoVariants()
    const colors = new Map([[36, [22, 163, 74]], [43, [234, 179, 8]], [41, [220, 38, 38]]])
    assert.deepEqual(beat.notes.map(note => note.style.colors.get(alphaTab.model.NoteSubElement.StandardNotationNoteHead)), keys.map(key => new alphaTab.model.Color(...colors.get(key))))

    const events = [
      ...outputs.map(key => new alphaTab.midi.NoteOnEvent(0, 100, 9, key, 90)),
      ...outputs.map(key => new alphaTab.midi.NoteOffEvent(0, 199, 9, key, 0)),
      new alphaTab.midi.NoteOnEvent(0, 200, 9, 36, 90),
      new alphaTab.midi.NoteOffEvent(0, 299, 9, 36, 0),
    ]
    api.applySurdoVariants(events)
    assert.deepEqual(events.map(event => event.noteKey), [...keys, ...keys, 36, 36])
  })
}

test('both Techno tracks request surdo 2 and 3 on the last played beat', () => {
  const data = readFileSync(new URL('../src/data/trackGroups.ts', import.meta.url), 'utf8')
  const exports = {}
  new Function('exports', ts.transpileModule(data, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(exports)
  const tracks = exports.trackGroups.find(group => group.id === 'techno').tracks
  for (const [title, measure] of [['Techno 1', 4], ['Techno 1 intro', 11]]) {
    const track = tracks.find(track => track.title === title)
    for (const surdo of ['surdo2', 'surdo3']) {
      assert.ok(track[surdo].some(beat => beat.measure === measure && beat.beat === 4.5), `${title}: missing ${surdo}`)
    }
  }
})

const circleSource = readFileSync(new URL('../src/components/CircularRhythmViewer.vue', import.meta.url), 'utf8')
const circleFunction = circleSource.slice(circleSource.indexOf('function surdoVariantsAt('), circleSource.indexOf('function surdoColor('))
const createCircle = new Function('props', ts.transpileModule(`${constants}\n${circleFunction}\nreturn surdoVariantsAt`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText)

test('circle gives offbeat surdo 3 priority over the preceding full-beat parameter', () => {
  const props = {
    surdo1: [{ measure: 1, beat: 1 }, { measure: 1, beat: 3.5 }],
    surdo2: [{ measure: 1, beat: 2 }, { measure: 1, beat: 4 }, { measure: 1, beat: 4.5 }],
    surdo3: [1.5, 2.5, 3.5, 4.5].map(beat => ({ measure: 1, beat })),
  }
  const notesAt = createCircle(props)
  const measures = [{ start: 0, duration: 4, numerator: 4, denominator: 4 }]
  for (const [beat, expected] of [[1, [36]], [1.5, [41]], [2, [43]], [2.5, [41]], [3.5, [36, 41]], [4, [43]], [4.5, [41, 43]]]) {
    assert.deepEqual(notesAt(beat - 1, measures), expected, `beat ${beat}`)
  }
})
