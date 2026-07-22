import { qs, qsa, haptic, fmtDate, esc } from '../ui.js';
import * as store from '../core/store.js';
import { bindAutosave, flashSaved } from '../core/autosave.js';

const MOODS = [['😀','Ótima'],['🙂','Bem'],['😐','Neutra'],['😞','Pra baixo'],['😴','Cansada'],['😡','Irritada']];

export default {
  title: 'Humor', subtitle: 'Como você está hoje',
  async render() {
    const date = store.dataDeTrabalho();
    const v = (await store.getDaily('mood', date))?.value || {};
    const rec = await store.getDaily('mood', date);
    const label = MOODS.find(m => m[0] === v.emoji)?.[1];
    const rows = await store.listDaily('mood');
    return `
      <div class="card">
        <div class="card-title" style="font-size:15px">${fmtDate(date, 'weekday')}</div>
        <div class="mood-row" style="margin-top:14px;flex-wrap:wrap;gap:8px">
          ${MOODS.map(m => `<button class="mood-btn ${v.emoji === m[0] ? 'active' : ''}"
            data-m="${m[0]}" style="flex:0 0 calc(33.333% - 6px)">${m[0]}</button>`).join('')}
        </div>
        <div class="center mt-4"><span class="chip" id="moodLabel">${label || 'Toque para registrar'}</span></div>
      </div>
      <div class="field"><label class="field-label">Quer contar mais?</label>
        <textarea class="textarea" placeholder="O que influenciou seu humor hoje?"
          data-save="note">${esc(rec?.note || '')}</textarea></div>
      ${rows.length ? `<div class="section-header"><span class="section-title">Últimos dias</span></div>
        <div class="list">${[...rows].reverse().slice(0, 14).map(r => `
          <div class="row"><div class="row-icon" style="background:transparent;font-size:20px">${esc(r.value?.emoji || '')}</div>
            <div class="row-body"><div class="row-title">${MOODS.find(m => m[0] === r.value?.emoji)?.[1] || '—'}</div>
            <div class="row-sub">${fmtDate(r.date, 'long')}${r.note ? ' · ' + esc(r.note) : ''}</div></div></div>`).join('')}</div>` : ''}`;
  },
  mount(root, params, ctx = {}) {
    const date = store.dataDeTrabalho();
    qsa('[data-m]', root).forEach(b => b.addEventListener('click', async () => {
      qsa('[data-m]', root).forEach(x => x.classList.remove('active'));
      b.classList.add('active'); haptic();
      qs('#moodLabel', root).textContent = MOODS.find(m => m[0] === b.dataset.m)?.[1] || '';
      await store.patchDaily('mood', date, { emoji: b.dataset.m });
      flashSaved();
    }));
    bindAutosave(root, async (field, value) => {
      const prev = await store.getDaily('mood', date, ctx);
      await store.setDaily('mood', date, prev?.value || {}, value);
    }, ctx);
  }
};
