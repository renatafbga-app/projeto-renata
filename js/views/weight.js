import { icon } from '../icons.js';
import { refresh } from '../router.js';
import { qs, qsa, lineChart, fmtDate, toast, haptic, esc } from '../ui.js';
import * as store from '../core/store.js';
import { bindAutosave } from '../core/autosave.js';

export default {
  title: 'Peso', subtitle: 'Registro e evolução',
  async render() {
    const s = store.getSettings();
    const rows = await store.listDaily('weight');
    const pts = rows.map(r => ({ date: r.date, v: Number(r.value?.kg) })).filter(p => p.v > 0);
    const cur = pts.at(-1)?.v;
    const today = await store.getDaily('weight', store.todayISO());
    const imc = cur && s.heightCm ? (cur / Math.pow(s.heightCm / 100, 2)).toFixed(1) : null;

    return `
      <div class="card">
        <div class="spread">
          <div><div class="stat-value">${cur ?? '—'}<span class="stat-unit">kg</span></div>
            <div class="stat-label">Peso atual</div></div>
          <div style="text-align:center"><div class="stat-value">${imc ?? '—'}</div>
            <div class="stat-label">IMC</div></div>
          <div style="text-align:right"><div class="stat-value">${s.goalWeight}<span class="stat-unit">kg</span></div>
            <div class="stat-label">Meta</div></div>
        </div>
      </div>

      <div class="card">
        <div class="field"><label class="field-label">Data</label>
          <input class="input" type="date" id="wDate" value="${store.todayISO()}"></div>
        <div class="field"><label class="field-label">Peso de hoje (kg)</label>
          <input class="input" type="number" step="0.1" inputmode="decimal" id="wVal"
            placeholder="Ex.: 72,4" value="${esc(today?.value?.kg ?? '')}" data-save="kg"></div>
        <div class="field mb-0"><label class="field-label">Observações</label>
          <input class="input" id="wNote" placeholder="Opcional" value="${esc(today?.note ?? '')}" data-save="note"></div>
      </div>

      ${pts.length > 1 ? `<div class="card">${lineChart(pts)}</div>` : ''}

      <div class="section-header"><span class="section-title">Histórico</span></div>
      ${rows.length ? `<div class="list">${[...rows].reverse().map(r => `
        <div class="row"><div class="row-body">
          <div class="row-title">${esc(r.value?.kg ?? '—')} kg</div>
          <div class="row-sub">${fmtDate(r.date, 'long')}${r.note ? ' · ' + esc(r.note) : ''}</div>
        </div>
        <button class="row-chevron" data-del="${r.date}" aria-label="Apagar">${icon('trash', 16)}</button>
        </div>`).join('')}</div>`
      : `<div class="empty"><div class="empty-text">Nenhum registro ainda. Anote seu peso acima.</div></div>`}`;
  },
  mount(root, params, ctx = {}) {
    const dateEl = qs('#wDate', root);
    bindAutosave(root, async (field, value) => {
      const date = dateEl.value || store.todayISO();
      const prev = await store.getDaily('weight', date);
      if (field === 'kg') {
        const kg = parseFloat(String(value).replace(',', '.'));
        if (!(kg > 0)) return;
        await store.setDaily('weight', date, { kg }, prev?.note || '');
      } else {
        await store.setDaily('weight', date, prev?.value || {}, value);
      }
    }, ctx);
    dateEl.addEventListener('change', async () => {
      const rec = await store.getDaily('weight', dateEl.value);
      qs('#wVal', root).value = rec?.value?.kg ?? '';
      qs('#wNote', root).value = rec?.note ?? '';
    }, { signal: ctx.signal });
    qsa('[data-del]', root).forEach(b => b.addEventListener('click', async () => {
      await store.removeDaily('weight', b.dataset.del);
      haptic(); toast('Registro apagado'); refresh();
    }));
  }
};
