import { icon } from '../icons.js';
import { refresh } from '../router.js';
import { qs, esc } from '../ui.js';
import * as store from '../core/store.js';
import { bindAutosave } from '../core/autosave.js';

const MEALS = [['breakfast','Café da manhã'],['snack1','Lanche da manhã'],['lunch','Almoço'],
               ['snack2','Lanche da tarde'],['dinner','Jantar'],['supper','Ceia']];

export default {
  title: 'Alimentação', subtitle: 'Registro das refeições',
  async render() {
    const date = store.todayISO();
    const v = (await store.getDaily('meals', date))?.value || {};
    return `
      <div class="card tight"><div class="field mb-0"><label class="field-label">Data</label>
        <input class="input" type="date" id="nDate" value="${date}"></div></div>
      ${MEALS.map(([k, label]) => `
        <div class="card">
          <div class="card-title" style="font-size:15px">${icon('meal', 18)} ${label}</div>
          <textarea class="textarea" style="min-height:58px;margin-top:10px"
            placeholder="O que você comeu?" data-save="${k}">${esc(v[k] || '')}</textarea>
        </div>`).join('')}
      <div class="card">
        <div class="card-title" style="font-size:15px">Observações do dia</div>
        <textarea class="textarea" style="margin-top:10px"
          placeholder="Fome, energia, vontade de doce…" data-save="note">${esc(v.note || '')}</textarea>
      </div>
      <div class="callout tip"><span class="t">Regra do prato</span>
        Metade vegetais, um quarto proteína, um quarto carboidrato e um fio de gordura boa.</div>`;
  },
  mount(root, params, ctx = {}) {
    const dateEl = qs('#nDate', root);
    bindAutosave(root, (field, value) =>
      store.patchDaily('meals', dateEl.value || store.todayISO(), { [field]: value }), ctx);
    dateEl.addEventListener('change', () => refresh());
  }
};
