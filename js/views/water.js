import { icon } from '../icons.js';
import { qs, qsa, haptic, toast } from '../ui.js';
import * as store from '../core/store.js';
import { flashSaved } from '../core/autosave.js';

export default {
  title: 'Água', subtitle: 'Meta diária de hidratação',
  async render() {
    const goal = store.getSettings().waterGoal;
    const ml = (await store.getDaily('water', store.todayISO()))?.value?.ml || 0;
    const pct = Math.min(Math.round((ml / goal) * 100), 100);
    return `
      <div class="card center">
        <div class="water-glass"><div class="water-level" id="wLevel" style="height:${pct}%"></div></div>
        <div class="stat-value" style="justify-content:center">
          <span id="wNow">${ml}</span><span class="stat-unit">/ ${goal} ml</span></div>
        <div class="stat-label" id="wPct">${pct}% da meta</div>
      </div>
      <div class="hstack" style="margin-bottom:12px">
        <button class="btn primary grow" data-add="250">${icon('plus', 19)} 250 ml</button>
        <button class="btn grow" data-add="500">+ 500 ml</button>
      </div>
      <button class="btn ghost block" data-add="-250">${icon('minus', 19)} Remover 250 ml</button>
      <div class="callout tip"><span class="t">Do livro</span>
        Meta de 2,5 a 3 litros por dia. A hidratação melhora o desempenho,
        controla o apetite e ajuda na recuperação.</div>`;
  },
  mount(root, params, ctx = {}) {
    const goal = store.getSettings().waterGoal;
    /* BUG CORRIGIDO (auditoria 4.5): o total era carregado numa Promise sem
       tratamento e sem trava. Tocar "+250" antes de ela resolver zerava o
       acumulado do dia. Agora lemos do banco a cada toque — é uma leitura
       barata e elimina a corrida por completo. */
    qsa('[data-add]', root).forEach(b => b.addEventListener('click', async () => {
      let cur;
      try {
        cur = (await store.getDaily('water', store.todayISO()))?.value?.ml || 0;
      } catch (err) {
        console.error('[água] não consegui ler o registro de hoje', err);
        return toast('Não consegui salvar agora. Tente de novo.');
      }
      cur = Math.max(0, cur + (+b.dataset.add));
      const pct = Math.min(Math.round((cur / goal) * 100), 100);
      qs('#wLevel', root).style.height = pct + '%';
      qs('#wNow', root).textContent = cur;
      qs('#wPct', root).textContent = pct + '% da meta';
      haptic();
      try {
        await store.setDaily('water', store.todayISO(), { ml: cur });
        flashSaved();
        if (cur >= goal) toast('Meta de água atingida!', 'ok');
      } catch (err) {
        console.error('[água] falha ao salvar', err);
        toast('Não consegui salvar agora. Tente de novo.');
      }
    }, { signal: ctx.signal }));
  }
};
