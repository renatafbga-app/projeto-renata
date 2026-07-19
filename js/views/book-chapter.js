/* Capítulo do livro — conteúdo integral, com índice interno e navegação
   para o capítulo anterior/seguinte. Tudo offline. */
import { icon } from '../icons.js';
import { qs, qsa, esc } from '../ui.js';
import { CHAPTERS } from '../../data/book.data.js';

const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default {
  compact: true,
  backLabel: 'Livro',
  title: p => (CHAPTERS.find(c => c.id === p.id) || {}).titulo || 'Capítulo',
  async render(p) {
    const i = CHAPTERS.findIndex(c => c.id === p.id);
    const c = CHAPTERS[i];
    if (!c) return `<div class="empty"><div class="empty-title">Capítulo não encontrado</div></div>`;

    const prev = CHAPTERS[i - 1], next = CHAPTERS[i + 1];

    // Índice interno: âncoras nos <h2> do capítulo
    let n = 0;
    const html = c.html.replace(/<h2([^>]*)>/g, () => `<h2 id="s${++n}">`);

    return `
      <h2 style="font-size:27px;font-weight:700;letter-spacing:-.7px;margin-bottom:5px">${esc(c.titulo)}</h2>
      <p class="muted" style="margin-bottom:16px">${esc(c.resumo)}</p>

      ${c.secoes.length > 1 ? `
        <nav class="chapter-nav" aria-label="Seções do capítulo">
          ${c.secoes.map((s, k) => `<a href="#/livro/${c.id}" data-jump="s${k + 1}">${esc(s)}</a>`).join('')}
        </nav>` : ''}

      <article class="prose selectable">${html}</article>

      <button class="to-top" id="toTop" aria-label="Voltar ao topo">${icon('chevronL', 20)}</button>

      <div class="chapter-pager">
        ${prev ? `<a class="btn sm" href="#/livro/${prev.id}">${icon('chevronL', 16)} ${esc(prev.titulo)}</a>`
               : `<a class="btn sm" href="#/livro">${icon('chevronL', 16)} Índice</a>`}
        ${next ? `<a class="btn sm primary" href="#/livro/${next.id}">${esc(next.titulo)} ${icon('chevron', 16)}</a>` : ''}
      </div>`;
  },
  mount(root, p, ctx = {}) {
    // memoriza onde a leitura parou (falha aqui nunca pode derrubar a tela)
    Promise.all([import('../core/store.js'), import('../core/schema.js')])
      .then(([store, { LS_PREFIX }]) =>
        store.safeSet(`${LS_PREFIX}book.last.${store.activeProfile()}`, p.id))
      .catch(err => console.warn('[livro] não consegui salvar a posição de leitura', err));
    // voltar ao topo aparece depois de rolar bastante
    const top = qs('#toTop', root);
    if (top) {
      top.style.transform = 'scale(.8) rotate(90deg)';
      const onScroll = () => {
        const show = window.scrollY > 700;
        top.classList.toggle('show', show);
        top.style.transform = show ? 'scale(1) rotate(90deg)' : 'scale(.8) rotate(90deg)';
      };
      window.addEventListener('scroll', onScroll, { passive: true, signal: ctx.signal });
      top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }), { signal: ctx.signal });
    }

    // rolagem suave até a seção, sem trocar a rota
    qsa('[data-jump]', root).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      qs('#' + a.dataset.jump, root)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  }
};
