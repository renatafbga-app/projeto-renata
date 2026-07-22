import { qs, qsa, haptic, lineChart, fmtDate, esc } from '../ui.js';
import * as store from '../core/store.js';
import { bindAutosave, flashSaved } from '../core/autosave.js';

const advice = v =>
  v === 0 ? 'Sem dor — siga o plano.' :
  v <= 3  ? 'Dor leve — pode treinar com atenção.' :
  v <= 6  ? 'Dor moderada — reduza carga e amplitude.' :
            'Dor alta — pare e procure orientação.';

export default {
  title: 'Dor no Joelho', subtitle: 'Pata de ganso · escala 0 a 10',
  async render() {
    const date = store.dataDeTrabalho();
    const rec = await store.getDaily('knee', date);
    const cur = rec?.value?.level;
    const rows = await store.listDaily('knee');
    const pts = rows.map(r => ({ date: r.date, v: Number(r.value?.level) })).filter(p => Number.isFinite(p.v));

    return `
      <div class="card">
        <div class="field">
          <label class="field-label">Qual o nível de dor hoje?</label>
          <div class="pain-scale">${Array.from({ length: 11 }, (_, i) => `
            <button class="pain-dot ${cur === i ? 'active' : ''}" data-p="${i}"
              ${cur === i ? `style="background:${i <= 3 ? 'var(--green)' : i <= 6 ? 'var(--yellow)' : 'var(--red)'};color:#fff"` : ''}>${i}</button>`).join('')}</div>
          <div class="center mt-4"><span class="chip" id="painLabel">
            ${cur != null ? advice(cur) : '0 = sem dor · 10 = dor máxima'}</span></div>
        </div>
        <div class="field mb-0"><label class="field-label">Observações</label>
          <textarea class="textarea" placeholder="Em que momento doeu? Qual exercício?"
            data-save="note">${esc(rec?.note || '')}</textarea></div>
      </div>

      ${pts.length > 1 ? `<div class="section-header"><span class="section-title">Evolução</span></div>
        <div class="card">${lineChart(pts)}
          <p class="tiny muted center">Tendência de queda = fortalecimento funcionando.</p></div>` : ''}

      <div class="callout knee"><span class="t">Regra do livro</span>
        Dor aguda, pontada ou inchaço significam parar o exercício. Reduza amplitude
        ou carga. Se persistir por dias, procure seu fisioterapeuta.</div>

      ${rows.length ? `<div class="section-header"><span class="section-title">Histórico</span></div>
        <div class="list">${[...rows].reverse().slice(0, 20).map(r => `
          <div class="row"><div class="row-body">
            <div class="row-title">Dor ${esc(r.value?.level)}/10</div>
            <div class="row-sub">${fmtDate(r.date, 'long')}${r.note ? ' · ' + esc(r.note) : ''}</div>
          </div></div>`).join('')}</div>` : ''}`;
  },
  mount(root, params, ctx = {}) {
    const date = store.dataDeTrabalho();
    qsa('[data-p]', root).forEach(b => b.addEventListener('click', async () => {
      qsa('[data-p]', root).forEach(x => { x.classList.remove('active'); x.style.background = ''; x.style.color = ''; });
      b.classList.add('active');
      const v = +b.dataset.p;
      b.style.background = v <= 3 ? 'var(--green)' : v <= 6 ? 'var(--yellow)' : 'var(--red)';
      b.style.color = '#fff';
      qs('#painLabel', root).textContent = advice(v);
      haptic();
      await store.patchDaily('knee', date, { level: v });
      flashSaved();
    }));
    bindAutosave(root, async (field, value) => {
      const prev = await store.getDaily('knee', date, ctx);
      await store.setDaily('knee', date, prev?.value || {}, value);
    }, ctx);
  }
};
