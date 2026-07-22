import { qs, qsa, haptic, esc } from '../ui.js';
import {  } from '../router.js';
import * as store from '../core/store.js';
import { bindAutosave, flashSaved } from '../core/autosave.js';

const hours = (a, b) => {
  if (!a || !b) return null;
  const [h1, m1] = a.split(':').map(Number), [h2, m2] = b.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 1440;
  return +(mins / 60).toFixed(1);
};

export default {
  title: 'Sono', subtitle: 'Onde o músculo se constrói',
  async render() {
    const date = store.dataDeTrabalho();
    const v = (await store.getDaily('sleep', date))?.value || {};
    const h = hours(v.bed, v.wake);
    return `
      <div class="card">
        <div class="input-row" style="margin-bottom:12px">
          <div class="grow"><label class="field-label">Dormi às</label>
            <input class="input" type="time" value="${esc(v.bed || '23:00')}" data-save="bed"></div>
          <div class="grow"><label class="field-label">Acordei às</label>
            <input class="input" type="time" value="${esc(v.wake || '07:00')}" data-save="wake"></div>
        </div>
        <div class="center" style="margin-bottom:12px">
          <span class="chip accent" id="sHours">${h ? h + ' h de sono' : 'Preencha os horários'}</span></div>
        <div class="field mb-0"><label class="field-label">Qualidade do sono</label>
          <div class="mood-row">${[1,2,3,4,5].map(n => `
            <button class="mood-btn ${v.quality === n ? 'active' : ''}" data-q="${n}"
              style="font-size:17px;font-weight:700">${n}</button>`).join('')}</div></div>
      </div>
      <div class="callout tip"><span class="t">Meta</span>
        7 a 8 horas por noite. Evite telas 30 minutos antes de dormir e mantenha
        horários parecidos todos os dias.</div>`;
  },
  mount(root, params, ctx = {}) {
    const date = () => store.dataDeTrabalho();
    bindAutosave(root, async (field, value) => {
      await store.patchDaily('sleep', date(), { [field]: value }, ctx);
      const rec = await store.getDaily('sleep', date());
      const h = hours(rec?.value?.bed, rec?.value?.wake);
      qs('#sHours', root).textContent = h ? `${h} h de sono` : 'Preencha os horários';
    }, ctx);
    qsa('[data-q]', root).forEach(b => b.addEventListener('click', async () => {
      qsa('[data-q]', root).forEach(x => x.classList.remove('active'));
      b.classList.add('active'); haptic();
      await store.patchDaily('sleep', date(), { quality: +b.dataset.q });
      flashSaved();
    }));
  }
};
