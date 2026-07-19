import { icon } from '../icons.js';
import { qs, qsa, esc } from '../ui.js';
import { EXERCISES } from '../../data/exercises.data.js';
import { figure } from '../../data/figures.data.js';

const GROUPS = [...new Set(EXERCISES.map(e => e.grupo))];

const card = e => `
  <a class="lib-card" href="#/biblioteca/${e.id}" data-name="${esc((e.nome + ' ' + e.musculos + ' ' + e.grupo).toLowerCase())}" data-group="${esc(e.grupo)}">
    <div class="lib-fig">${figure(e.key)}</div>
    <div class="lib-body">
      <div class="lib-name">${esc(e.nome)}</div>
      <div class="lib-group">${esc(e.grupo)}</div>
    </div>
  </a>`;

export default {
  title: 'Biblioteca',
  subtitle: `${EXERCISES.length} exercícios ilustrados`,
  render() {
    return `
      <div class="search">
        ${icon('search', 18)}
        <input type="search" id="libSearch" placeholder="Buscar por nome ou músculo…" autocomplete="off">
      </div>
      <div class="week-strip" id="libFilters">
        <button class="week-pill active" data-g="">Todos</button>
        ${GROUPS.map(g => `<button class="week-pill" data-g="${esc(g)}">${esc(g)}</button>`).join('')}
      </div>
      <div class="lib-grid" id="libGrid">${EXERCISES.map(card).join('')}</div>
      <div id="libEmpty" hidden>
        <div class="empty"><div class="empty-title">Nada encontrado</div>
        <div class="empty-text">Tente outro termo de busca.</div></div>
      </div>`;
  },
  mount(root, params, ctx = {}) {
    const grid = qs('#libGrid', root);
    const search = qs('#libSearch', root);
    let group = '';

    const apply = () => {
      const q = search.value.trim().toLowerCase();
      let visible = 0;
      qsa('.lib-card', grid).forEach(c => {
        const okG = !group || c.dataset.group === group;
        const okQ = !q || c.dataset.name.includes(q);
        const show = okG && okQ;
        c.hidden = !show;
        if (show) visible++;
      });
      qs('#libEmpty', root).hidden = visible > 0;
    };

    search.addEventListener('input', apply);
    qsa('[data-g]', root).forEach(b => b.addEventListener('click', () => {
      group = b.dataset.g;
      qsa('[data-g]', root).forEach(x => x.classList.toggle('active', x === b));
      apply();
    }));
  }
};
