/* Ficha completa do exercício: execução, respiração, músculos, erros comuns,
   cuidados, alongamentos relacionados e evolução real das cargas. */
import { icon } from '../icons.js';
import { esc, lineChart, empty } from '../ui.js';
import { EXERCISES } from '../../data/exercises.data.js';
import { figure } from '../../data/figures.data.js';
import * as store from '../core/store.js';
import { bindAutosave } from '../core/autosave.js';
import { LS_PREFIX } from '../core/schema.js';

const dots = n => `<span class="diff">${Array.from({ length: 3 }, (_, i) =>
  `<span class="${i < n ? 'on' : ''}"></span>`).join('')}</span>`;
const LABEL = { 1: 'Iniciante', 2: 'Intermediário', 3: 'Avançado' };
const noteKey = id => `${LS_PREFIX}exnote.${store.activeProfile()}.${id}`;

export default {
  compact: true,
  backLabel: 'Biblioteca',
  title: p => (EXERCISES.find(e => e.id === p.id) || {}).nome || 'Exercício',
  async render(p) {
    const i = EXERCISES.findIndex(x => x.id === p.id);
    const e = EXERCISES[i];
    if (!e) return `<div class="empty"><div class="empty-title">Exercício não encontrado</div></div>`;
    const prev = EXERCISES[i - 1], next = EXERCISES[i + 1];
    const s = await store.loadStats(e.key);
    const note = localStorage.getItem(noteKey(e.id)) || '';

    return `
      <div class="figure" style="margin-bottom:16px">${figure(e.key)}</div>

      <div class="row-sub" style="letter-spacing:1.2px">EXERCÍCIO ${String(e.no).padStart(2, '0')}</div>
      <h2 style="font-size:26px;font-weight:700;letter-spacing:-.6px;margin-top:2px">${esc(e.nome)}</h2>
      <div class="hstack" style="margin:10px 0 18px;flex-wrap:wrap">
        <span class="chip teal">${esc(e.grupo)}</span>
        <span class="chip">${dots(e.dif)} ${LABEL[e.dif]}</span>
      </div>

      <div class="card tight">
        <div class="row-sub" style="margin-bottom:4px">MÚSCULOS TRABALHADOS</div>
        <div>${esc(e.musculos)}</div>
      </div>
      <div class="card tight">
        <div class="row-sub" style="margin-bottom:4px">CARGA SUGERIDA NO LIVRO</div>
        <div>${esc(e.carga)}</div>
      </div>

      ${e.cuidados ? `<div class="callout knee">
        <span class="t">Atenção ao joelho</span>${esc(e.cuidados)}</div>` : ''}

      <div class="section-header"><span class="section-title">Execução</span></div>
      <div class="card"><ol class="steps" style="margin:0;padding-left:18px">
        ${e.execucao.map(x => `<li style="margin-bottom:7px">${esc(x)}</li>`).join('')}
      </ol></div>

      <div class="section-header"><span class="section-title">Respiração</span></div>
      <div class="card tight"><div class="hstack">
        <div class="row-icon teal">${icon('bolt', 18)}</div>
        <div class="grow">${esc(e.respiracao)}</div>
      </div></div>

      <div class="section-header"><span class="section-title">Erros comuns</span></div>
      <div class="card">
        ${e.erros.map(x => `<div class="hstack" style="align-items:flex-start;margin-bottom:9px">
          <span style="color:var(--red);font-weight:700;line-height:1.4">✕</span>
          <span class="grow">${esc(x)}</span></div>`).join('')}
      </div>

      <div class="section-header"><span class="section-title">Alongamentos relacionados</span></div>
      <div class="card flush">
        ${e.alongamentos.map(a => `
          <div class="row">
            <div class="ex-thumb" style="width:46px;height:46px">${figure(a.key)}</div>
            <div class="row-body">
              <div class="row-title">${esc(a.nome)}</div>
              <div class="row-sub" style="white-space:normal">${esc(a.desc)}</div>
              <div class="row-sub teal">${esc(a.dur)}</div>
            </div>
          </div>`).join('')}
      </div>

      <div class="section-header"><span class="section-title">Progressão de carga</span></div>
      ${s.count ? `
        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);gap:8px">
          <div class="stat" style="padding:12px"><div class="stat-value" style="font-size:20px">${s.last}<span class="stat-unit">kg</span></div><div class="stat-label">Última</div></div>
          <div class="stat" style="padding:12px"><div class="stat-value" style="font-size:20px">${s.max}<span class="stat-unit">kg</span></div><div class="stat-label">Maior</div></div>
          <div class="stat" style="padding:12px"><div class="stat-value" style="font-size:20px">${s.avg}<span class="stat-unit">kg</span></div><div class="stat-label">Média</div></div>
        </div>
        ${s.history.length > 1 ? `<div class="card">${lineChart(s.history)}</div>` : ''}
        <div class="callout tip"><span class="t">Sugestão para hoje: ${s.suggestion} kg</span>${esc(s.reason)}</div>`
      : `<div class="card">${empty('dumbbell', 'Sem histórico ainda',
          'Assim que você registrar cargas neste exercício, a evolução aparece aqui.')}</div>`}

      <div class="section-header"><span class="section-title">Minhas observações</span></div>
      <textarea class="textarea" data-save="note"
        placeholder="Anote o que funciona para você neste exercício…">${esc(note)}</textarea>

      <div class="chapter-pager">
        ${prev ? `<a class="btn sm" href="#/biblioteca/${prev.id}">${icon('chevronL', 16)} Anterior</a>`
               : `<a class="btn sm" href="#/biblioteca">${icon('chevronL', 16)} Biblioteca</a>`}
        ${next ? `<a class="btn sm primary" href="#/biblioteca/${next.id}">Próximo ${icon('chevron', 16)}</a>` : ''}
      </div>`;
  },
  mount(root, p, ctx = {}) {
    bindAutosave(root, (field, value) => store.safeSet(noteKey(p.id), value), ctx);
  }
};
