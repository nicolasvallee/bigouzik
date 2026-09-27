export function normalizeMusicXml(xml: string) {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  document.querySelectorAll('work-title').forEach((title) => title.remove())
  document.querySelectorAll('creator[type="composer"]').forEach((creator) => creator.remove())
  normalizeNoteDynamics(document)
  const scoreParts = Array.from(document.querySelectorAll('score-part'))

  scoreParts.forEach((scorePart) => {
    const instrumentNames = new Map<string, string>()
    scorePart.querySelectorAll('score-instrument').forEach((instrument) => {
      const id = instrument.getAttribute('id')
      const name = instrument.querySelector('instrument-name')?.textContent?.toLowerCase() ?? ''
      if (id) instrumentNames.set(id, name)
    })

    scorePart.querySelectorAll('midi-instrument').forEach((instrument) => {
      const id = instrument.getAttribute('id')
      const name = id ? instrumentNames.get(id) ?? '' : ''
      const midiUnpitched = instrument.querySelector('midi-unpitched')
      if (!midiUnpitched) return

      if (name.includes('snare')) midiUnpitched.textContent = '39'
      if (name.includes('kick') || name.includes('bass drum')) midiUnpitched.textContent = '37'
    })

    const part = Array.from(document.querySelectorAll('part')).find(
      (candidate) => candidate.getAttribute('id') === scorePart.getAttribute('id'),
    )
    if (!part) return

    const partName = scorePart.querySelector('part-name')?.textContent?.toLowerCase() ?? ''
    const isPercussion = partName.includes('drum') || part.querySelector('clef sign')?.textContent?.toLowerCase() === 'percussion'
    if (!isPercussion) return

    part.querySelectorAll('staff-lines').forEach((staffLines) => {
      staffLines.textContent = '1'
    })
    part.querySelectorAll('note').forEach((note) => {
      if (!note.querySelector('unpitched') || !note.querySelector('instrument')) return
      if (!note.querySelector('notehead')) {
        const notehead = document.createElement('notehead')
        notehead.textContent = 'normal'
        note.append(notehead)
      }
    })
  })

  return new XMLSerializer().serializeToString(document)
}

function normalizeNoteDynamics(document: XMLDocument) {
  document.querySelectorAll('note[dynamics]').forEach((note) => {
    const value = Number(note.getAttribute('dynamics'))
    if (!Number.isFinite(value)) return

    note.removeAttribute('dynamics')
    const notations = Array.from(note.children).find((child) => child.localName === 'notations')
      ?? document.createElement('notations')
    const dynamics = document.createElement('dynamics')
    const mark = document.createElement(dynamicMarkFor(value))
    dynamics.append(mark)
    notations.append(dynamics)

    if (!notations.parentElement) note.append(notations)
  })
}

function dynamicMarkFor(value: number) {
  if (value <= 20) return 'ppp'
  if (value <= 40) return 'pp'
  if (value <= 55) return 'mp'
  if (value <= 70) return 'mf'
  if (value <= 90) return 'f'
  if (value <= 105) return 'ff'
  return 'fff'
}
