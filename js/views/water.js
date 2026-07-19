import { icon } from '../icons.js';
import { qs, qsa, haptic, toast, esc, fmtDate, sheet } from '../ui.js';
import * as store from '../core/store.js';
import { flashSaved } from '../core/autosave.js';
import { refresh } from '../router.js';

const RAPIDOS = [180, 250, 300, 500, 750, 1000];

export default {
  title: 'Água',
  subtitle: 'Meta diária de hidratação',
  async render() {
    const goal = store.getSettings().waterGoal;
    const hoje = store.todayISO();
    const rec = await store.getDaily('water', hoje);
    const ml = rec?.value?.ml || 0;
    const registros = rec?.value?.log || [];
    const pct = Math.min(Math.round((ml / goal) * 100), 100);
    const faltam = Math.max(goal - ml, 0);

    const historico = (await store.listDaily('water')).slice(-7).reverse();

    return `
      <div class="card center">
        <div class="water-glass">
          <div class="water-level" id="wLevel" style="height:${pct}%"></div>
        </div>
        <div class="stat-value" style="justify-content:center">
          <span id="wNow">${ml}</span><span class="stat-unit">de ${goal} ml</span>
        </div>
        <div class="stat-label" id="wPct">${pct}% da meta</div>
        <div class="bar" style="margin-top:14px">
          <div class="bar-fill" id="wBar" style="width:${pct}%"></div>
        </div>
        <p class="tiny muted" id="wFalta" style="margin-top:10px">
          ${faltam > 0 ? `Faltam ${faltam} ml para a meta de hoje.` : 'Meta de hoje alcançada. Muito bem!'}
        </p>
      </div>

      <div class="section-header"><span class="section-title">Adicionar</span></div>
      <div class="quick-grid">
        ${RAPIDOS.map(v => `<button class="quick-btn" data-add="${v}">
          <span class="qv">+${v}</span><span class="qu">ml</span></button>`).join('')}
      </div>
      <div class="hstack mt-2">
        <button class="btn grow" id="outroVolume">${icon('plus', 19)} Outro volume</button>
        <button class="btn ghost grow" id="desfazer" ${registros.length ? '' : 'disabled'}>
          ${icon('minus', 19)} Desfazer último
        </button>
      </div>

      ${registros.length ? `
        <div class="section-header"><span class="section-title">Hoje</span></div>
        <div class="chip-row">
          ${registros.map((r, i) => `<span class="chip">${r.ml} ml · ${esc(r.hora)}</span>`).join('')}
        </div>` : ''}

      ${historico.length > 1 ? `
        <div class="section-header"><span class="section-title">Últimos dias</span></div>
        <div class="list">
          ${historico.map(h => {
            const v = h.value?.ml || 0;
            const p = Math.min(Math.round((v / goal) * 100), 100);
            return `<div class="row">
              <div class="row-body">
                <div class="row-title">${v} ml</div>
                <div class="row-sub">${fmtDate(h.date, 'long')}</div>
                <div class="bar" style="margin-top:6px;height:5px">
                  <div class="bar-fill" style="width:${p}%"></div>
                </div>
              </div>
              <span class="chip ${p >= 100 ? 'green' : ''}">${p}%</span>
            </div>`;
          }).join('')}
        </div>` : ''}

      <div class="callout tip">
        <span class="t">Por que importa</span>
        <p>Meta de 2,5 a 3 litros por dia. A hidratação melhora o desempenho no
        treino, ajuda a controlar o apetite e acelera a recuperação.</p>
      </div>`;
  },

  mount(root, params, ctx = {}) {
    const sig = { signal: ctx.signal };
    const goal = store.getSettings().waterGoal;
    const hoje = store.todayISO();

    async function adicionar(delta) {
      try {
        const rec = await store.getDaily('water', hoje);
        const atual = rec?.value?.ml || 0;
        const log = [...(rec?.value?.log || [])];
        const novo = Math.max(0, atual + delta);

        if (delta > 0) {
          log.push({ ml: delta, hora: new Date().toTimeString().slice(0, 5) });
        } else {
          log.pop();
        }
        await store.setDaily('water', hoje, { ml: novo, log });

        const pct = Math.min(Math.round((novo / goal) * 100), 100);
        qs('#wLevel', root).style.height = pct + '%';
        qs('#wBar', root).style.width = pct + '%';
        qs('#wNow', root).textContent = novo;
        qs('#wPct', root).textContent = pct + '% da meta';
        const faltam = Math.max(goal - novo, 0);
        qs('#wFalta', root).textContent = faltam > 0
          ? `Faltam ${faltam} ml para a meta de hoje.`
          : 'Meta de hoje alcançada. Muito bem!';
        haptic();
        flashSaved();
        if (novo >= goal && atual < goal) toast('Meta de água alcançada!', 'ok');
        refresh();
      } catch (err) {
        console.error('[água]', err);
        toast('Não consegui salvar agora. Tente de novo.');
      }
    }

    qsa('[data-add]', root).forEach(b =>
      b.addEventListener('click', () => adicionar(+b.dataset.add), sig));

    qs('#desfazer', root)?.addEventListener('click', async () => {
      const rec = await store.getDaily('water', hoje);
      const ultimo = rec?.value?.log?.at(-1);
      if (!ultimo) return toast('Nada para desfazer hoje.');
      adicionar(-ultimo.ml);
    }, sig);

    qs('#outroVolume', root)?.addEventListener('click', () => {
      sheet({
        title: 'Outro volume',
        body: `
          <div class="field">
            <label class="field-label" for="volLivre">Quantidade em mililitros</label>
            <input class="input" type="number" inputmode="numeric" id="volLivre"
                   placeholder="Ex.: 430" min="1" max="5000">
          </div>
          <p class="tiny muted" style="margin-bottom:16px">
            Use para copos, garrafas ou canecas fora dos tamanhos padrão.
          </p>
          <button class="btn primary block" id="volConfirmar">Adicionar</button>`,
        onMount(layer, fechar) {
          const campo = qs('#volLivre', layer);
          setTimeout(() => campo.focus(), 120);
          const confirmar = () => {
            const v = parseInt(campo.value, 10);
            if (!Number.isFinite(v) || v <= 0) return toast('Informe um valor maior que zero.');
            if (v > 5000) return toast('Valor muito alto. Confira a quantidade.');
            fechar();
            adicionar(v);
          };
          qs('#volConfirmar', layer).addEventListener('click', confirmar);
          campo.addEventListener('keydown', e => { if (e.key === 'Enter') confirmar(); });
        }
      });
    }, sig);
  }
};
