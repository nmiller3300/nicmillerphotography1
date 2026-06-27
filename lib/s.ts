import type { CSSProperties } from 'react'

/**
 * Converts a CSS string like "position:relative; width:100%; background:rgba(0,0,0,0.5)"
 * to a React CSSProperties object. Handles nested parens in values (rgba, url, etc).
 */
export function s(css: string): CSSProperties {
  const obj: Record<string, string> = {}
  const parts: string[] = []
  let depth = 0, current = ''

  for (const char of css) {
    if (char === '(' || char === '[') depth++
    else if (char === ')' || char === ']') depth--
    if (char === ';' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())

  for (const part of parts) {
    const colonIdx = part.indexOf(':')
    if (colonIdx === -1) continue
    const prop = part.slice(0, colonIdx).trim()
    const val = part.slice(colonIdx + 1).trim()
    if (!prop || !val) continue
    const camelProp = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    obj[camelProp] = val
  }

  return obj as CSSProperties
}
