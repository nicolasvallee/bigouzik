import { midi } from '@coderline/alphatab'

export const LOOP_COPIES = 50

export function repeatMidi(file: midi.MidiFile, lookup: midi.MidiTickLookup) {
  const bars = [...lookup.masterBars]
  const cycleTicks = bars[bars.length - 1]?.end ?? 0
  if (cycleTicks <= 0) return false

  for (const track of file.tracks) {
    const events = track.events.filter((event) => event.type !== midi.MidiEventType.EndOfTrack)
    const endings = track.events.filter((event) => event.type === midi.MidiEventType.EndOfTrack)
    track.events.length = 0
    for (let copy = 0; copy < LOOP_COPIES; copy += 1) {
      for (const event of events) {
        // Preserve alphaTab event prototypes for serialization into the synth worker.
        track.events.push(Object.assign(Object.create(Object.getPrototypeOf(event)), event, {
          tick: event.tick + copy * cycleTicks,
        }))
      }
    }
    for (const ending of endings) {
      ending.tick += (LOOP_COPIES - 1) * cycleTicks
      track.events.push(ending)
    }
    // Note-offs from the preceding copy must precede note-ons at the same boundary.
    track.events.sort((a, b) => a.tick - b.tick)
  }

  // Beat slices are relative to their bar and can be shared across occurrences.
  for (let copy = 1; copy < LOOP_COPIES; copy += 1) {
    const offset = copy * cycleTicks
    for (const bar of bars) {
      const repeatedBar = new midi.MasterBarTickLookup()
      repeatedBar.masterBar = bar.masterBar
      repeatedBar.start = bar.start + offset
      repeatedBar.end = bar.end + offset
      repeatedBar.firstBeat = bar.firstBeat
      repeatedBar.lastBeat = bar.lastBeat
      repeatedBar.tempoChanges.push(...bar.tempoChanges.map((change) =>
        new midi.MasterBarTickLookupTempoChange(change.tick + offset, change.tempo),
      ))
      lookup.addMasterBar(repeatedBar)
    }
  }
  return true
}
