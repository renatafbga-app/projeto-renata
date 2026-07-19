import { icon } from '../icons.js';
import { qsa, esc } from '../ui.js';
import { PROGRAM } from '../../data/program.data.js';
import * as store from '../core/store.js';

const WEEKS = [...new Set(PROGRAM.map(d => d.week))];

function grid(week) {
  return PROGRAM.filter(d => d.week === week).map(d => {
    const done = store.isDayComplete(d.day);
    const locked = store.isDayLocked(d.day);
    const today = d.day === store.currentDay();
    const cls = ['day-cell', done && 'done', locked && 'locked', today && !done && 'today']
      .filter(Boolean).join(' ');
    const tag = locked ? 'div' : 'a';
    const href = locked ? '' : `href="#/treinos/dia/${d.day}"`;
    return `<${tag} class="${cls}" ${href}>
      ${done ? `<span class="day-badge">${icon('check', 10)}</span>` : ''}
      ${locked ? `<span class="day-badge" style="background:var(--fill);color:var(--label-3)">${icon('lock', 10)}</span>` : ''}
      <div class="n">${d.day}</div><div class="t">${esc(d.title)}</div></${tag}>`;
  }).join('');
}

export default {
  title: 'Treinos',
  subtitle: '90 dias · 13 semanas',
  async render() {
    const w = PROGRAM.find(d => d.day === store.currentDay()).week;
    const done = store.getProgress().completedDays.length;
    return `
      <div class="card tight">
        <div class="spread">
          <div><div class="row-title">${done} de 90 concluídos</div>
            <div class="row-sub">${store.getSettings().freeMode ? 'Modo livre ativo' : 'Desbloqueio em sequência'}</div></div>
          <span class="chip accent">${Math.round(done / 90 * 100)}%</span>
        </div>
        <div class="bar mt-2"><div class="bar-fill" style="width:${done / 90 * 100}%"></div></div>
      </div>
      <div class="week-strip">
        ${WEEKS.map(n => `<button class="week-pill${n === w ? ' active' : ''}" data-week="${n}">Semana ${n}</button>`).join('')}
      </div>
      <div class="section-header">
        <span class="section-title" id="weekLabel">Semana ${w}</span>
        <span class="section-action" id="blockLabel">${esc(PROGRAM.find(d => d.week === w).blockname)}</span>
      </div>
      <div class="day-grid" id="dayGrid">${grid(w)}</div>`;
  },
  mount(root, params, ctx = {}) {
    qsa('[data-week]', root).forEach(btn => btn.addEventListener('click', () => {
      const n = +btn.dataset.week;
      qsa('[data-week]', root).forEach(b => b.classList.toggle('active', b === btn));
      root.querySelector('#dayGrid').innerHTML = grid(n);
      root.querySelector('#weekLabel').textContent = `Semana ${n}`;
      root.querySelector('#blockLabel').textContent = PROGRAM.find(d => d.week === n).blockname;
    }));
  }
};
