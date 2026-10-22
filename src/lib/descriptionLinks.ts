export function descriptionLinks(description: string) {
  const parts: { text: string; href?: string }[] = []
  let end = 0

  for (const match of description.matchAll(/\[([^\]\n]+)\]\(([^)\s]+)\)/g)) {
    const [markup, text, href] = match
    // Allow site paths and web links; leave other targets as plain text.
    if (!/^(?:\/(?!\/)|https?:\/\/)/i.test(href) || /[\\\u0000-\u0020\u007f]/.test(href)) continue

    parts.push({ text: description.slice(end, match.index) }, { text, href })
    end = match.index + markup.length
  }

  parts.push({ text: description.slice(end) })
  return parts
}
