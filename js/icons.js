/* Conjunto de ícones SVG — traço 1.8, estilo iOS. Sem dependências. */
const P = {
  home:      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  dumbbell:  '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
  book:      '<path d="M4 4.5h6a2.5 2.5 0 0 1 2.5 2.5v13A2 2 0 0 0 10.5 18H4z"/><path d="M20 4.5h-6a2.5 2.5 0 0 0-2.5 2.5v13A2 2 0 0 1 13.5 18H20z"/>',
  chart:     '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  grid:      '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  more:      '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  scale:     '<path d="M4 7h16l-2.5 13h-11z"/><path d="M9 11h6"/>',
  ruler:     '<rect x="2.5" y="8.5" width="19" height="7" rx="1.5"/><path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4"/>',
  drop:      '<path d="M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3z"/>',
  meal:      '<path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10"/><path d="M16 3c-1.5 1.5-2 3-2 5s1 3 2 3 2-1 2-3-.5-3.5-2-5zM16 11v10"/>',
  moon:      '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  smile:     '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>',
  knee:      '<path d="M9 3v6.5a4 4 0 0 0 1.5 3.1l1.5 1.2a4 4 0 0 1 1.5 3.1V21"/><circle cx="10.5" cy="11" r="3.2"/>',
  pen:       '<path d="M4 20h4L20 8a2.5 2.5 0 0 0-3.5-3.5L4 16.5z"/><path d="M14.5 6 18 9.5"/>',
  gear:      '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1.1z"/>',
  chevron:   '<path d="M9 5l7 7-7 7"/>',
  chevronL:  '<path d="M15 5l-7 7 7 7"/>',
  check:     '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  minus:     '<path d="M5 12h14"/>',
  play:      '<path d="M7 4.5v15l13-7.5z"/>',
  timer:     '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',
  close:     '<path d="M6 6l12 12M18 6L6 18"/>',
  flame:     '<path d="M12 3s1 3-1 5-3 3-3 6a4 4 0 0 0 8 0c0-2-1-3-1-4 2 1 3 2.5 3 4.5A6 6 0 0 1 12 21a6 6 0 0 1-6-6c0-5 6-6 6-12z"/>',
  clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  trophy:    '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M10 14h4M9 20h6M12 14v6"/>',
  calendar:  '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  bell:      '<path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"/><path d="M10.5 20a1.8 1.8 0 0 0 3 0"/>',
  search:    '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
  download:  '<path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 20h16"/>',
  upload:    '<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M4 20h16"/>',
  sun:       '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5"/>',
  trash:     '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  target:    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  bolt:      '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
  stretch:   '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M12 13l-4 7M12 13l4 7M6 9.5l6 1.5 6-1.5"/>',
  lock:      '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>',
  heart:     '<path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20z"/>'
};

export function icon(name, size = 24) {
  const d = P[name] || P.grid;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
}
