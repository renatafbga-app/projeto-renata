import { icon } from '../icons.js';
import { esc } from '../ui.js';
import { CHAPTERS } from '../../data/book.data.js';
import { LS_PREFIX } from '../core/schema.js';
import * as store from '../core/store.js';

const K_LAST = () => `${LS_PREFIX}book.last.${store.activeProfile()}`;

export default {
  title: 'Livro',
  subtitle: `${CHAPTERS.length} capítulos · conteúdo integral`,
  async render() {
    const last = localStorage.getItem(K_LAST());
    const lastCh = CHAPTERS.find(c => c.id === last);
    return `
      ${lastCh ? `
        <a class="card accent" href="#/livro/${lastCh.id}" style="display:block;text-decoration:none">
          <div class="card-title" style="color:#fff">Continuar lendo</div>
          <div class="card-sub">${esc(lastCh.titulo)}</div>
        </a>` : `
        <div class="card accent">
          <div class="card-title" style="color:#fff">Projeto Renata · 90 Dias</div>
          <div class="card-sub">Todo o conteúdo do livro impresso, disponível offline.</div>
        </div>`}

      <div class="section-header"><span class="section-title">Capítulos</span></div>
      <div class="list">
        ${CHAPTERS.map((c, i) => `
          <a class="row chapter-row" href="#/livro/${c.id}">
            <div class="row-icon">${String(i + 1).padStart(2, '0')}</div>
            <div class="row-body">
              <div class="row-title">${esc(c.titulo)}</div>
              <div class="row-sub">${esc(c.resumo)}</div>
            </div>
            <span class="row-chevron">${icon('chevron', 15)}</span>
          </a>`).join('')}
      </div>`;
  }
};
