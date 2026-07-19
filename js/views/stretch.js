/* Ficha de alongamento — mesmo padrão visual e de navegação dos exercícios. */
import { icon } from '../icons.js';
import { esc } from '../ui.js';
import { STRETCHES, acharAlongamento } from '../../data/stretches.data.js';
import { figure } from '../../data/figures.data.js';
import * as store from '../core/store.js';
import { bindAutosave } from '../core/autosave.js';
import { LS_PREFIX } from '../core/schema.js';

const noteKey = id => `${LS_PREFIX}alnote.${store.activeProfile()}.${id}`;

export default {
  compact: true,
  backLabel: 'Biblioteca',
  title: p => acharAlongamento(p.id)?.nome || 'Alongamento',
  async render(p) {
    const i = STRETCHES.findIndex(x => x.id === p.id || x.key === p.id);
    const a = STRETCHES[i];
    if (!a) return `<div class="empty">
      <div class="empty-title">Alongamento não encontrado</div>
      <a class="btn primary" href="#/alongamentos" style="margin-top:16px">Ver a biblioteca</a></div>`;

    const anterior = STRETCHES[i - 1], proximo = STRETCHES[i + 1];
    const nota = localStorage.getItem(noteKey(a.id)) || '';

    return `
      <div class="figure" style="margin-bottom:16px">${figure(a.key)}</div>

      <div class="row-sub" style="letter-spacing:1.2px">
        ALONGAMENTO ${String(a.no).padStart(2, '0')}
      </div>
      <h2 style="font-size:26px;font-weight:700;letter-spacing:-.6px;margin-top:2px">
        ${esc(a.nome)}
      </h2>
      <div class="hstack" style="margin:10px 0 18px;flex-wrap:wrap">
        <span class="chip teal">${esc(a.regiao)}</span>
        <span class="chip">${icon('clock', 14)} ${esc(a.tempo)}</span>
      </div>

      <div class="card tight">
        <div class="row-sub" style="margin-bottom:4px">MÚSCULOS ALONGADOS</div>
        <div>${esc(a.musculos)}</div>
      </div>

      <div class="section-header"><span class="section-title">Objetivo</span></div>
      <div class="card"><p style="margin:0">${esc(a.objetivo)}</p></div>

      <div class="section-header"><span class="section-title">Como executar</span></div>
      <div class="card">
        <ol class="steps" style="margin:0;padding-left:18px">
          ${a.execucao.map(x => `<li style="margin-bottom:7px">${esc(x)}</li>`).join('')}
        </ol>
      </div>

      <div class="section-header"><span class="section-title">Respiração</span></div>
      <div class="card tight">
        <div class="hstack">
          <div class="row-icon teal">${icon('bolt', 18)}</div>
          <div class="grow">${esc(a.respiracao)}</div>
        </div>
      </div>

      <div class="section-header"><span class="section-title">Tempo recomendado</span></div>
      <div class="card tight">
        <div class="hstack">
          <div class="row-icon">${icon('timer', 18)}</div>
          <div class="grow">${esc(a.tempo)}. Sem repique — mantenha a posição parada.</div>
        </div>
      </div>

      <div class="section-header"><span class="section-title">Erros comuns</span></div>
      <div class="card">
        ${a.erros.map(x => `
          <div class="hstack" style="align-items:flex-start;margin-bottom:9px">
            <span style="color:var(--red);font-weight:700;line-height:1.4">✕</span>
            <span class="grow">${esc(x)}</span>
          </div>`).join('')}
      </div>

      <div class="callout knee">
        <span class="t">Cuidados</span>
        <p>${esc(a.cuidados)}</p>
      </div>

      <div class="callout note">
        <span class="t">Quando evitar</span>
        <p>${esc(a.evitar)}</p>
      </div>

      <div class="callout tip">
        <span class="t">Observações</span>
        <p>${esc(a.observacoes)}</p>
      </div>

      <div class="section-header"><span class="section-title">Minhas observações</span></div>
      <textarea class="textarea" data-save="nota"
        placeholder="Anote o que funciona para você neste alongamento…">${esc(nota)}</textarea>

      <div class="chapter-pager">
        ${anterior
          ? `<a class="btn sm" href="#/alongamentos/${anterior.id}">${icon('chevronL', 16)} Anterior</a>`
          : `<a class="btn sm" href="#/alongamentos">${icon('chevronL', 16)} Biblioteca</a>`}
        ${proximo
          ? `<a class="btn sm primary" href="#/alongamentos/${proximo.id}">Próximo ${icon('chevron', 16)}</a>`
          : ''}
      </div>`;
  },
  mount(root, p, ctx = {}) {
    const a = acharAlongamento(p.id);
    if (a) bindAutosave(root, (campo, valor) => store.safeSet(noteKey(a.id), valor), ctx);
  }
};
