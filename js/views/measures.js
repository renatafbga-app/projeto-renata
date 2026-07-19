/* Medidas corporais — 9 circunferências + peso, com histórico e gráficos. */
import { icon } from '../icons.js';
import { qs, qsa, lineChart, fmtDate, esc, toast, haptic, empty } from '../ui.js';
import * as store from '../core/store.js';
import { MEASURE_FIELDS } from '../core/schema.js';
import { bindAutosave } from '../core/autosave.js';
import { refresh } from '../router.js';

const PARES = [
  ['Tronco',   ['waist', 'abdomen', 'hip']],
  ['Braços',   ['armR', 'armL']],
  ['Pernas',   ['thighR', 'thighL', 'calfR', 'calfL']]
];
const nomeDe = k => MEASURE_FIELDS.find(f => f.key === k)?.nome || k;

export default {
  title: 'Medidas',
  subtitle: 'Circunferências e evolução',
  async render() {
    const hoje = store.todayISO();
    const rec = await store.getDaily('measures', hoje);
    const v = rec?.value || {};
    const pesoHoje = (await store.getDaily('weight', hoje))?.value?.kg ?? '';
    const linhas = await store.listDaily('measures');

    // primeira medição como referência para mostrar a variação
    const primeira = linhas[0]?.value || {};
    const ultima = linhas.at(-1)?.value || {};

    const variacao = k => {
      const a = Number(primeira[k]), b = Number(ultima[k]);
      if (!(a > 0) || !(b > 0) || linhas.length < 2) return '';
      const d = +(b - a).toFixed(1);
      if (d === 0) return '<span class="chip">estável</span>';
      return `<span class="chip ${d < 0 ? 'green' : ''}">${d > 0 ? '+' : ''}${d} cm</span>`;
    };

    return `
      <div class="card tight">
        <div class="tiny muted">
          Meça pela manhã, relaxada, com a fita paralela ao chão e sem apertar.
          Tudo é salvo automaticamente.
        </div>
      </div>

      <div class="card">
        <div class="field">
          <label class="field-label" for="mData">Data da medição</label>
          <input class="input" type="date" id="mData" value="${hoje}">
        </div>
        <div class="field">
          <label class="field-label" for="mPeso">Peso (kg)</label>
          <input class="input" type="number" step="0.1" inputmode="decimal"
                 id="mPeso" placeholder="—" value="${esc(pesoHoje)}" data-save="peso">
        </div>
      </div>

      ${PARES.map(([grupo, chaves]) => `
        <div class="section-header"><span class="section-title">${grupo}</span></div>
        <div class="card">
          ${chaves.map((k, i) => `
            <div class="field ${i === chaves.length - 1 ? 'mb-0' : ''}">
              <label class="field-label" for="m_${k}">${nomeDe(k)} (cm)</label>
              <input class="input" type="number" step="0.5" inputmode="decimal"
                     id="m_${k}" placeholder="—" value="${esc(v[k] ?? '')}" data-save="${k}">
            </div>`).join('')}
        </div>`).join('')}

      ${linhas.length >= 2 ? `
        <div class="section-header"><span class="section-title">Evolução</span></div>
        ${['waist', 'abdomen', 'hip'].map(k => {
          const pts = linhas
            .map(r => ({ date: r.date, v: Number(r.value?.[k]) }))
            .filter(p => p.v > 0);
          if (pts.length < 2) return '';
          return `<div class="card">
            <div class="spread" style="margin-bottom:8px">
              <span class="row-title">${nomeDe(k)}</span>${variacao(k)}
            </div>
            ${lineChart(pts)}
          </div>`;
        }).join('') || `<div class="card">${empty('ruler', 'Ainda sem gráfico',
            'Registre a mesma medida em duas datas diferentes.')}</div>`}
      ` : ''}

      ${linhas.length ? `
        <div class="section-header"><span class="section-title">Histórico</span></div>
        <div class="list">
          ${[...linhas].reverse().map(r => {
            const preenchidas = MEASURE_FIELDS.filter(f => r.value?.[f.key]);
            return `<div class="row">
              <div class="row-body">
                <div class="row-title">${fmtDate(r.date, 'long')}</div>
                <div class="row-sub" style="white-space:normal">
                  ${preenchidas.length
                    ? preenchidas.map(f => `${f.nome} ${esc(r.value[f.key])} cm`).join(' · ')
                    : 'Sem valores registrados'}
                </div>
              </div>
              <button class="row-chevron" data-del="${r.date}" aria-label="Apagar medição">
                ${icon('trash', 16)}
              </button>
            </div>`;
          }).join('')}
        </div>` : `
        <div class="card">${empty('ruler', 'Nenhuma medição ainda',
          'Preencha os campos acima — o registro é salvo sozinho.')}</div>`}

      <div class="callout tip">
        <span class="t">Por que medir os dois lados</span>
        <p>Braços e pernas costumam ter diferenças naturais. Acompanhar cada lado
        separadamente ajuda a perceber assimetrias e a corrigi-las no treino.</p>
      </div>`;
  },

  mount(root, params, ctx = {}) {
    const sig = { signal: ctx.signal };
    const dataEl = qs('#mData', root);
    const dataAtual = () => dataEl.value || store.todayISO();

    bindAutosave(root, async (campo, valor) => {
      const n = parseFloat(String(valor).replace(',', '.'));
      if (!(n > 0)) return;
      if (campo === 'peso') {
        const anterior = await store.getDaily('weight', dataAtual());
        await store.setDaily('weight', dataAtual(), { kg: n }, anterior?.note || '');
      } else {
        await store.patchDaily('measures', dataAtual(), { [campo]: n });
      }
    }, ctx);

    dataEl.addEventListener('change', refresh, sig);

    qsa('[data-del]', root).forEach(b => b.addEventListener('click', async () => {
      await store.removeDaily('measures', b.dataset.del);
      haptic(); toast('Medição apagada');
      refresh();
    }, sig));
  }
};
