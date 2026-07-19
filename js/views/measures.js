import { qs, lineChart, fmtDate, esc } from '../ui.js';
import { refresh } from '../router.js';
import * as store from '../core/store.js';
import { bindAutosave } from '../core/autosave.js';

const M = [['arm','Braço'],['chest','Peito'],['waist','Cintura'],['abdomen','Abdômen'],
           ['hip','Quadril'],['thigh','Coxa'],['calf','Panturrilha']];

export default {
  title: 'Medidas', subtitle: '7 medidas corporais',
  async render() {
    const date = store.todayISO();
    const rec = await store.getDaily('measures', date);
    const v = rec?.value || {};
    const rows = await store.listDaily('measures');
    const waist = rows.map(r => ({ date: r.date, v: Number(r.value?.waist) })).filter(p => p.v > 0);

    return `
      <div class="card tight"><div class="tiny muted">
        Meça pela manhã, relaxada, com a fita paralela ao chão. Salva sozinho.</div></div>
      <div class="card">
        <div class="field"><label class="field-label">Data</label>
          <input class="input" type="date" id="mDate" value="${date}"></div>
        ${M.map(([k, label]) => `
          <div class="field"><label class="field-label">${label} (cm)</label>
            <input class="input" type="number" step="0.5" inputmode="decimal"
              placeholder="—" value="${esc(v[k] ?? '')}" data-save="${k}"></div>`).join('')}
      </div>
      ${waist.length > 1 ? `
        <div class="section-header"><span class="section-title">Cintura</span></div>
        <div class="card">${lineChart(waist)}</div>` : ''}
      ${rows.length ? `
        <div class="section-header"><span class="section-title">Histórico</span></div>
        <div class="list">${[...rows].reverse().map(r => `
          <div class="row"><div class="row-body">
            <div class="row-title">${fmtDate(r.date, 'long')}</div>
            <div class="row-sub">${M.filter(([k]) => r.value?.[k])
              .map(([k, l]) => `${l} ${esc(r.value[k])}`).join(' · ') || 'Sem valores'}</div>
          </div></div>`).join('')}</div>` : ''}`;
  },
  mount(root, params, ctx = {}) {
    const dateEl = qs('#mDate', root);
    bindAutosave(root, async (field, value) => {
      const n = parseFloat(String(value).replace(',', '.'), ctx);
      if (!(n > 0)) return;
      await store.patchDaily('measures', dateEl.value || store.todayISO(), { [field]: n });
    }, ctx);
    dateEl.addEventListener('change', () => refresh());
  }
};
