import { midi } from '@coderline/alphatab'
import { SIDE_STICK_MIDI_NOTE, SNARE_MIDI_NOTE, SURDO_1_MIDI_NOTE, SURDO_2_MIDI_NOTE, SURDO_3_MIDI_NOTE } from './percussion'

export const percussionChannels = { snare: 0, kick: 1, other: 9 } as const

// MusicXML puts every percussion part on channel 9. Separate notes for live muting.
export function separatePercussionChannels(file: midi.MidiFile) {
  const sampleKeys = new Set<number>()
  for (const track of file.tracks) {
    const events: midi.MidiEvent[] = []
    for (const event of track.events) {
      events.push(event)
      if (!('channel' in event) || event.channel !== 9) continue
      if ('noteKey' in event) {
        const note = event as midi.NoteEvent
        sampleKeys.add(note.noteKey)
        if (note.noteKey === SIDE_STICK_MIDI_NOTE || note.noteKey === SNARE_MIDI_NOTE) {
          note.channel = percussionChannels.snare
        } else if ([SURDO_1_MIDI_NOTE, SURDO_2_MIDI_NOTE, SURDO_3_MIDI_NOTE].includes(note.noteKey)) {
          note.channel = percussionChannels.kick
        }
      } else {
        for (const channel of [percussionChannels.snare, percussionChannels.kick]) {
          const copy = Object.assign(Object.create(Object.getPrototypeOf(event)), event, { channel })
          if (copy.type === midi.MidiEventType.ControlChange) {
            // SoundFont percussion bank 128 also works on channels other than 9.
            if (copy.controller === midi.ControllerType.BankSelectCoarse) copy.value = 1
            if (copy.controller === midi.ControllerType.BankSelectFine) copy.value = 0
          }
          events.push(copy)
        }
      }
    }
    track.events.length = 0
    track.events.push(...events)
  }

  // alphaTab only discovers percussion samples from channel 9; silent notes preload
  // the sounds moved to the other channels without adding audible hits. Put them
  // before real notes: zero velocity can release a matching sound on any channel.
  const firstTrack = file.tracks[0]
  if (firstTrack) {
    firstTrack.events.unshift(...Array.from(sampleKeys, key => new midi.NoteOnEvent(0, 0, 9, key, 0)))
  }
}

export function updatePercussionMute(
  player: { setChannelMute(channel: number, mute: boolean): void },
  selected: 'both' | 'snare' | 'kick',
) {
  player.setChannelMute(percussionChannels.snare, selected === 'kick')
  player.setChannelMute(percussionChannels.kick, selected === 'snare')
  player.setChannelMute(percussionChannels.other, selected !== 'both')
}
