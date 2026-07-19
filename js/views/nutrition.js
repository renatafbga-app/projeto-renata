/* Diário nutricional — alimentos com macros calculados a partir de tabela local. */
import { icon } from '../icons.js';
import { qs, qsa, esc, toast, haptic, sheet } from '../ui.js';
import * as store from '../core/store.js';
import { buscarAlimentos, somar, FOODS, calcularPorQuantidade,
         descreverMedida, formatarQtd, passoDe } from '../../data/foods.data.js';
import { bindAutosave } from '../core/autosave.js';
import { refresh } from '../router.js';

const REFEICOES = [
  { key: 'breakfast', nome: 'Café da manhã' },
  { key: 'snack1',    nome: 'Lanche da manhã' },
  { key: 'lunch',     nome: 'Almoço' },
  { key: 'snack2',    nome: 'Lanche da tarde' },
  { key: 'dinner',    nome: 'Jantar' },
  { key: 'supper',    nome: 'Ceia' }
];

const totaisDe = valor =>
  somar(REFEICOES.flatMap(r => valor?.[r.key]?.itens || []));

export default {
  title: 'Alimentação',
  subtitle: 'Diário nutricional',
  async render() {
    const hoje = store.todayISO();
    const rec = await store.getDaily('meals', hoje);
    const valor = rec?.value || {};
    const s = store.getSettings();
    const t = totaisDe(valor);
    const pctKcal = Math.min(Math.round((t.kcal / s.calorieGoal) * 100), 100);
    const pctProt = Math.min(Math.round((t.p / s.proteinGoal) * 100), 100);

    return `
      <div class="card">
        <div class="spread" style="margin-bottom:10px">
          <div>
            <div class="stat-value">${t.kcal}<span class="stat-unit">de ${s.calorieGoal} kcal</span></div>
            <div class="stat-label">Consumo de hoje</div>
          </div>
          <span class="chip ${pctKcal > 100 ? 'red' : pctKcal >= 70 ? 'green' : ''}">${pctKcal}%</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${pctKcal}%"></div></div>

        <div class="macro-grid">
          <div class="macro">
            <div class="macro-v">${t.p}<small>g</small></div>
            <div class="macro-l">Proteína</div>
            <div class="bar" style="height:4px"><div class="bar-fill" style="width:${pctProt}%"></div></div>
          </div>
          <div class="macro">
            <div class="macro-v">${t.c}<small>g</small></div>
            <div class="macro-l">Carboidrato</div>
          </div>
          <div class="macro">
            <div class="macro-v">${t.g}<small>g</small></div>
            <div class="macro-l">Gordura</div>
          </div>
          <div class="macro">
            <div class="macro-v">${t.f}<small>g</small></div>
            <div class="macro-l">Fibra</div>
          </div>
        </div>
        <p class="tiny muted" style="margin-top:12px">
          Meta de proteína: ${t.p} de ${s.proteinGoal} g.
          ${t.p >= s.proteinGoal
            ? 'Alcançada — é ela que preserva seu músculo.'
            : `Faltam ${+(s.proteinGoal - t.p).toFixed(1)} g.`}
        </p>
      </div>

      <div class="card tight">
        <div class="field mb-0">
          <label class="field-label" for="nData">Data</label>
          <input class="input" type="date" id="nData" value="${hoje}">
        </div>
      </div>

      ${REFEICOES.map(r => {
        const itens = valor[r.key]?.itens || [];
        const sub = somar(itens);
        return `
        <div class="card">
          <div class="spread">
            <div class="card-title" style="font-size:15px">${icon('meal', 18)} ${r.nome}</div>
            ${itens.length ? `<span class="chip">${sub.kcal} kcal</span>` : ''}
          </div>

          ${itens.length ? `
            <div class="food-list">
              ${itens.map((it, i) => `
                <div class="food-item">
                  <div class="grow">
                    <div class="food-nome">
                      ${it.medidaTexto ? `<strong>${esc(it.medidaTexto)}</strong> · ` : ''}${esc(it.nome)}
                    </div>
                    <div class="food-macros">
                      ${it.gramas ? `${it.gramas} g · ` : ''}${it.kcal} kcal · P ${it.p} · C ${it.c} · G ${it.g}
                    </div>
                  </div>
                  <button class="row-chevron" data-remover="${r.key}:${i}" aria-label="Remover alimento">
                    ${icon('close', 15)}
                  </button>
                </div>`).join('')}
            </div>` : ''}

          <button class="btn sm block mt-2" data-add-alimento="${r.key}">
            ${icon('plus', 16)} Adicionar alimento
          </button>

          <textarea class="textarea" style="min-height:44px;margin-top:10px"
                    placeholder="Observações desta refeição…"
                    data-save="nota:${r.key}">${esc(valor[r.key]?.nota || '')}</textarea>
        </div>`;
      }).join('')}

      <div class="card">
        <div class="card-title" style="font-size:15px">Observações do dia</div>
        <textarea class="textarea" style="margin-top:10px"
                  placeholder="Fome, energia, vontade de doce…"
                  data-save="notaDia">${esc(valor.notaDia || '')}</textarea>
      </div>

      <div class="callout tip">
        <span class="t">Regra do prato</span>
        <p>Metade do prato com vegetais, um quarto com proteína, um quarto com
        carboidrato e um fio de gordura boa. Simples e eficiente em qualquer refeição.</p>
      </div>
      <div class="callout note">
        <span class="t">Sobre os números</span>
        <p>Os valores vêm de uma tabela nutricional local com ${FOODS.length} alimentos
        e são estimativas de referência, não medições exatas. Se um alimento não
        estiver na lista, use a opção de lançamento manual.</p>
      </div>`;
  },

  mount(root, params, ctx = {}) {
    const sig = { signal: ctx.signal };
    const dataEl = qs('#nData', root);
    const dataAtual = () => dataEl.value || store.todayISO();

    dataEl.addEventListener('change', refresh, sig);

    bindAutosave(root, async (campo, valor) => {
      const rec = await store.getDaily('meals', dataAtual());
      const atual = rec?.value || {};
      if (campo === 'notaDia') {
        await store.patchDaily('meals', dataAtual(), { notaDia: valor });
      } else if (campo.startsWith('nota:')) {
        const key = campo.slice(5);
        await store.patchDaily('meals', dataAtual(), {
          [key]: { ...(atual[key] || {}), nota: valor }
        });
      }
    }, ctx);

    /* remover item */
    qsa('[data-remover]', root).forEach(b => b.addEventListener('click', async () => {
      const [key, idx] = b.dataset.remover.split(':');
      const rec = await store.getDaily('meals', dataAtual());
      const itens = [...(rec?.value?.[key]?.itens || [])];
      itens.splice(+idx, 1);
      await store.patchDaily('meals', dataAtual(), {
        [key]: { ...(rec?.value?.[key] || {}), itens }
      });
      haptic(); refresh();
    }, sig));

    /* adicionar alimento */
    qsa('[data-add-alimento]', root).forEach(b =>
      b.addEventListener('click', () => abrirBusca(b.dataset.addAlimento), sig));

    function abrirBusca(refeicao) {
      const nome = REFEICOES.find(r => r.key === refeicao)?.nome || '';
      sheet({
        title: `Adicionar em ${nome}`,
        body: `
          <div class="search" style="margin-bottom:12px">
            ${icon('search', 18)}
            <input type="search" id="fBusca" placeholder="Buscar alimento…" autocomplete="off">
          </div>
          <div id="fResultados"></div>
          <div class="section-header"><span class="section-title">Não encontrou?</span></div>
          <button class="btn block" id="fManual">${icon('pen', 18)} Lançar manualmente</button>`,
        onMount(layer, fechar) {
          const campo = qs('#fBusca', layer);
          const area = qs('#fResultados', layer);
          setTimeout(() => campo.focus(), 120);

          const desenhar = lista => {
            if (!campo.value.trim()) {
              area.innerHTML = `<p class="tiny muted center" style="padding:14px 0">
                Digite o nome do alimento. Ex.: frango, arroz, iogurte.</p>`;
              return;
            }
            if (!lista.length) {
              area.innerHTML = `<p class="tiny muted center" style="padding:14px 0">
                Nenhum alimento encontrado. Use o lançamento manual abaixo.</p>`;
              return;
            }
            area.innerHTML = `<div class="list">${lista.map(f => `
              <button class="row" data-food="${f.id}">
                <div class="row-body">
                  <div class="row-title">${esc(f.nome)}</div>
                  <div class="row-sub">${f.kcal} kcal · P ${f.p} · C ${f.c} · G ${f.g} (por 100 g)</div>
                </div>
                <span class="row-chevron">${icon('chevron', 15)}</span>
              </button>`).join('')}</div>`;
            qsa('[data-food]', area).forEach(el =>
              el.addEventListener('click', () => escolherQuantidade(FOODS.find(f => f.id === el.dataset.food))));
          };

          desenhar([]);
          campo.addEventListener('input', () => desenhar(buscarAlimentos(campo.value)));

          function escolherQuantidade(food) {
            const passo = passoDe(food);
            let qtd = 1;

            area.innerHTML = `
              <div class="card">
                <div class="row-title">${esc(food.nome)}</div>
                <div class="row-sub" style="margin-bottom:14px">
                  ${food.kcal} kcal por 100 g
                </div>

                <div class="field">
                  <label class="field-label">Medida</label>
                  <div class="medida-box" id="qMedida"></div>
                </div>

                <div class="field">
                  <label class="field-label" for="qCampo">Quantidade</label>
                  <div class="stepper">
                    <button type="button" id="qMenos" aria-label="Diminuir">−</button>
                    <input class="input value" id="qCampo" type="number"
                           inputmode="decimal" step="${passo}" min="${passo}" value="1"
                           style="max-width:110px">
                    <button type="button" id="qMais" aria-label="Aumentar">+</button>
                  </div>
                  ${food.frac
                    ? `<p class="tiny muted" style="margin:8px 0 0 4px">
                         Aceita meia porção: 0,5 · 1,5 · 2,5…</p>`
                    : ''}
                </div>

                <div class="card tight" id="qPrevia" style="background:var(--bg-elev-2)"></div>
                <button class="btn primary block mt-2" id="qConfirmar">Adicionar ao diário</button>
              </div>`;

            const campo = qs('#qCampo', area);
            const previa = qs('#qPrevia', area);
            const medidaBox = qs('#qMedida', area);

            const atualizar = () => {
              const m = calcularPorQuantidade(food, qtd);
              medidaBox.textContent = descreverMedida(food, qtd);
              previa.innerHTML = `
                <div class="spread" style="margin-bottom:8px">
                  <strong style="font-size:var(--fs-headline)">${m.kcal} kcal</strong>
                  <span class="tiny muted">${m.gramas} g</span>
                </div>
                <div class="macro-grid" style="margin-top:0">
                  <div class="macro"><div class="macro-v">${m.p}<small>g</small></div>
                    <div class="macro-l">Proteína</div></div>
                  <div class="macro"><div class="macro-v">${m.c}<small>g</small></div>
                    <div class="macro-l">Carbo</div></div>
                  <div class="macro"><div class="macro-v">${m.g}<small>g</small></div>
                    <div class="macro-l">Gordura</div></div>
                  <div class="macro"><div class="macro-v">${m.f}<small>g</small></div>
                    <div class="macro-l">Fibra</div></div>
                </div>`;
            };

            const definir = novo => {
              const limpo = Math.round(Math.max(passo, Math.min(99, novo)) / passo) * passo;
              qtd = +limpo.toFixed(1);
              campo.value = formatarQtd(qtd).replace(',', '.');
              atualizar();
            };

            qs('#qMenos', area).addEventListener('click', () => { definir(qtd - passo); haptic(); });
            qs('#qMais',  area).addEventListener('click', () => { definir(qtd + passo); haptic(); });
            campo.addEventListener('input', () => {
              const v = parseFloat(String(campo.value).replace(',', '.'));
              if (Number.isFinite(v) && v > 0) { qtd = v; atualizar(); }
            });
            campo.addEventListener('blur', () => definir(qtd));

            atualizar();

            qs('#qConfirmar', area).addEventListener('click', async () => {
              if (!(qtd > 0)) return toast('Informe uma quantidade maior que zero.');
              const m = calcularPorQuantidade(food, qtd);
              // UM único lançamento com a quantidade escolhida
              await adicionarItem(refeicao, {
                nome: food.nome, foodId: food.id,
                qtd, medidaTexto: descreverMedida(food, qtd),
                gramas: m.gramas, kcal: m.kcal, p: m.p, c: m.c, g: m.g, f: m.f
              });
              fechar();
            });
          }

          qs('#fManual', layer).addEventListener('click', () => {
            area.innerHTML = `
              <div class="card">
                <div class="field">
                  <label class="field-label" for="mNome">Alimento</label>
                  <input class="input" id="mNome" placeholder="Ex.: Torta da vovó">
                </div>
                <div class="input-row" style="margin-bottom:12px">
                  <div class="grow"><label class="field-label" for="mKcal">Calorias</label>
                    <input class="input" type="number" inputmode="numeric" id="mKcal" placeholder="kcal"></div>
                  <div class="grow"><label class="field-label" for="mProt">Proteína (g)</label>
                    <input class="input" type="number" inputmode="decimal" id="mProt" placeholder="g"></div>
                </div>
                <div class="input-row" style="margin-bottom:12px">
                  <div class="grow"><label class="field-label" for="mCarb">Carboidrato (g)</label>
                    <input class="input" type="number" inputmode="decimal" id="mCarb" placeholder="g"></div>
                  <div class="grow"><label class="field-label" for="mGord">Gordura (g)</label>
                    <input class="input" type="number" inputmode="decimal" id="mGord" placeholder="g"></div>
                </div>
                <button class="btn primary block" id="mConfirmar">Adicionar</button>
              </div>`;
            qs('#mConfirmar', area).addEventListener('click', async () => {
              const nomeItem = qs('#mNome', area).value.trim();
              if (!nomeItem) return toast('Dê um nome ao alimento.');
              const num = id => Math.max(0, parseFloat(String(qs(id, area).value).replace(',', '.')) || 0);
              await adicionarItem(refeicao, {
                nome: nomeItem, gramas: 0, manual: true,
                kcal: Math.round(num('#mKcal')), p: num('#mProt'),
                c: num('#mCarb'), g: num('#mGord'), f: 0
              });
              fechar();
            });
          });
        }
      });
    }

    async function adicionarItem(refeicao, item) {
      const rec = await store.getDaily('meals', dataAtual());
      const atual = rec?.value || {};
      const itens = [...(atual[refeicao]?.itens || []), item];
      await store.patchDaily('meals', dataAtual(), {
        [refeicao]: { ...(atual[refeicao] || {}), itens }
      });
      haptic();
      toast(`${item.medidaTexto ? item.medidaTexto + ' · ' : ''}${item.nome} adicionado`, 'ok');
      refresh();
    }
  }
};
