/* Helpers de UI: seleção, eventos, toasts, sheets, formatação e gráficos SVG. */
import { icon } from './icons.js';

export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

/* Delegação de eventos — sobrevive a re-renders */
export function on(root, evt, sel, fn) {
  root.addEventListener(evt, e => {
    const t = e.target.closest(sel);
    if (t && root.contains(t)) fn(e, t);
  });
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ---------------- Formatação ---------------- */
export const pad2 = n => String(n).padStart(2, '0');
export const todayISO = () => new Date().toISOString().slice(0, 10);
export function fmtDate(iso, style = 'short') {
  const d = new Date(iso + (iso.length === 10 ? 'T12:00:00' : ''));
  if (style === 'long') return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  if (style === 'weekday') return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
export const fmtTime = sec => `${Math.floor(sec / 60)}:${pad2(sec % 60)}`;
export const fmtNum = (n, d = 0) => Number(n).toLocaleString('pt-BR',
  { minimumFractionDigits: d, maximumFractionDigits: d });

/* ---------------- Feedback tátil ---------------- */
export function haptic(ms = 12) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch {} }

/* ---------------- Toast ---------------- */
export function toast(msg, kind = '') {
  const layer = qs('#toastLayer');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = (kind === 'ok' ? icon('check', 18) : '') + `<span>${esc(msg)}</span>`;
  layer.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }, 1900);
}

/* ---------------- Sheet (modal inferior) ---------------- */
export function sheet({ title = '', body = '', onMount } = {}) {
  const layer = qs('#sheetLayer');
  layer.hidden = false;
  layer.innerHTML = `
    <div class="sheet-backdrop" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grabber"></div>
      ${title ? `<div class="sheet-title">${esc(title)}</div>` : ''}
      <div class="sheet-body">${body}</div>
    </div>`;
  const close = () => { layer.hidden = true; layer.innerHTML = ''; };
  qs('[data-close]', layer).addEventListener('click', close);
  layer.querySelectorAll('[data-dismiss]').forEach(b => b.addEventListener('click', close));
  onMount?.(layer, close);
  return close;
}

/* ---------------- Anel de progresso ---------------- */
export function ring({ value = 0, max = 100, size = 108, stroke = 10, label = '', unit = '' }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return `
    <div class="ring-wrap" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" aria-hidden="true">
        <circle class="ring-track" cx="${size/2}" cy="${size/2}" r="${r}"
                fill="none" stroke-width="${stroke}"/>
        <circle class="ring-fill" cx="${size/2}" cy="${size/2}" r="${r}"
                fill="none" stroke-width="${stroke}"
                stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"
                transform="rotate(-90 ${size/2} ${size/2})"/>
      </svg>
      <div class="ring-center">
        <div class="ring-value">${value}${unit}</div>
        <div class="ring-label">${esc(label)}</div>
      </div>
    </div>`;
}

/* ---------------- Gráfico de linha (SVG puro) ---------------- */
export function lineChart(points, { w = 340, h = 172, pad = 26 } = {}) {
  if (!points.length) return emptyChart();
  const vals = points.map(p => p.v);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const X = i => pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1);
  const Y = v => h - pad - ((v - min) / span) * (h - pad * 2);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${X(points.length - 1).toFixed(1)} ${h - pad} L${X(0).toFixed(1)} ${h - pad} Z`;
  const dots = points.map((p, i) =>
    `<circle class="chart-dot" cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="3"/>`).join('');
  const grid = [0, .5, 1].map(t =>
    `<line class="chart-grid" x1="${pad}" y1="${(pad + t * (h - pad * 2)).toFixed(1)}"
      x2="${w - pad}" y2="${(pad + t * (h - pad * 2)).toFixed(1)}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${grid}<path class="chart-area" d="${area}"/><path class="chart-line" d="${line}"/>${dots}
    <text class="chart-axis" x="2" y="${pad + 4}">${fmtNum(max, 1)}</text>
    <text class="chart-axis" x="2" y="${h - pad + 4}">${fmtNum(min, 1)}</text>
  </svg>`;
}
export function emptyChart() {
  return `<div class="empty"><div class="empty-text">Ainda sem dados suficientes para o gráfico.</div></div>`;
}

/* ---------------- Estado vazio ---------------- */
export function empty(iconName, title, text) {
  return `<div class="empty">${icon(iconName, 44)}
    <div class="empty-title">${esc(title)}</div>
    <div class="empty-text">${esc(text)}</div></div>`;
}
