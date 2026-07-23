/* Diário nutricional — alimentos com macros calculados a partir de tabela local. */
import { icon } from '../icons.js';
import { qs, qsa, esc, toast, haptic, sheet } from '../ui.js';
import * as store from '../core/store.js';
import * as foods from '../core/foods.js';
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
  foods.somar(REFEICOES.flatMap(r => valor?.[r.key]?.itens || []));

export default {
  title: 'Alimentação',
  subtitle: 'Diário nutricional',
  async render() {
    const hoje = store.dataDeTrabalho();
    const rec = await store.getDaily('meals', hoje);
    const valor = rec?.value || {};
    const totalAlimentos = (await foods.listarTodos()).length;
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
        <div class="macro-grid" style="grid-template-columns:1fr 1fr;margin-top:8px">
          <div class="macro">
            <div class="macro-v">${t.ac}<small>g</small></div>
            <div class="macro-l">Açúcar</div>
          </div>
          <div class="macro">
            <div class="macro-v">${t.sod}<small>mg</small></div>
            <div class="macro-l">Sódio</div>
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
        const sub = foods.somar(itens);
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

          <div class="hstack mt-2">
            <button class="btn sm grow" data-add-alimento="${r.key}">
              ${icon('plus', 16)} Adicionar alimento
            </button>
            ${itens.length ? `<button class="btn sm ghost" data-salvar-combo="${r.key}"
              aria-label="Salvar como refeição favorita">${icon('heart', 16)}</button>` : ''}
          </div>

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
        <p>Os valores vêm de uma base nutricional local com ${totalAlimentos} alimentos
        e são estimativas de referência, não medições exatas. Se um alimento não
        estiver na lista, use a opção de lançamento manual.</p>
      </div>`;
  },

  mount(root, params, ctx = {}) {
    const sig = { signal: ctx.signal };
    const dataAtual = () => store.dataDeTrabalho();


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

    /* salvar refeição atual como favorita */
    qsa('[data-salvar-combo]', root).forEach(b => b.addEventListener('click', async () => {
      const key = b.dataset.salvarCombo;
      const rec = await store.getDaily('meals', dataAtual());
      const itens = rec?.value?.[key]?.itens || [];
      if (!itens.length) return toast('Esta refeição está vazia.');
      const sugestao = REFEICOES.find(r => r.key === key)?.nome || 'Minha refeição';
      const nome = prompt('Nome da refeição favorita:', `Meu ${sugestao.toLowerCase()}`);
      if (nome === null) return;
      try {
        await foods.salvarRefeicaoFavorita(nome, itens);
        toast('Refeição favorita salva', 'ok');
      } catch (err) { toast(err.message); }
    }, sig));

    async function abrirBusca(refeicao) {
      const nome = REFEICOES.find(r => r.key === refeicao)?.nome || '';
      const recentes = await foods.recentesCompletos(8);
      const favoritos = await foods.listarFavoritos();
      const categorias = await foods.contarPorCategoria();
      const combos = await foods.listarRefeicoesFavoritas();

      sheet({
        title: `Adicionar em ${nome}`,
        body: `
          <div class="search" style="margin-bottom:12px">
            ${icon('search', 18)}
            <input type="search" id="fBusca" placeholder="Buscar alimento ou categoria…" autocomplete="off">
          </div>

          <div class="week-strip" id="fCategorias">
            <button class="week-pill active" data-cat="">Todas</button>
            ${[...categorias.entries()].map(([cat, n]) =>
              `<button class="week-pill" data-cat="${esc(cat)}">${esc(cat)} · ${n}</button>`).join('')}
          </div>

          <div id="fResultados"></div>

          <div class="section-header"><span class="section-title">Não encontrou?</span></div>
          <button class="btn block" id="fManual">${icon('pen', 18)} Criar alimento próprio</button>`,

        onMount(layer, fechar) {
          const campo = qs('#fBusca', layer);
          const area = qs('#fResultados', layer);
          let categoria = '';
          setTimeout(() => campo.focus(), 120);

          const linhaAlimento = f => `
            <div class="row">
              <button class="row-body" data-food="${esc(f.id)}" style="text-align:left;background:none;padding:0">
                <div class="row-title">
                  ${f.favorito ? '<span aria-hidden="true">★</span> ' : ''}${esc(f.nome)}
                </div>
                <div class="row-sub">${f.kcal} kcal · P ${f.p} · C ${f.c} · G ${f.g} (100 g)</div>
                <div class="row-sub" style="color:var(--label-3)">${esc(f.cat)}</div>
              </button>
              <button class="row-chevron" data-fav="${esc(f.id)}"
                      aria-label="${f.favorito ? 'Remover dos favoritos' : 'Marcar como favorito'}"
                      style="color:${f.favorito ? 'var(--accent)' : 'var(--label-4)'};font-size:19px">★</button>
            </div>`;

          const ligarCombos = raiz => {
            qsa('[data-combo]', raiz).forEach(el => el.addEventListener('click', async () => {
              const c = combos.find(x => x.id === el.dataset.combo);
              if (!c) return;
              for (const item of c.itens) { await adicionarItem(refeicao, { ...item }); if (item.foodId) await foods.registrarUso(item.foodId); }
              fechar();
              toast(`${c.nome} adicionada`, 'ok');
            }));
            qsa('[data-combo-del]', raiz).forEach(el => el.addEventListener('click', async e => {
              e.stopPropagation();
              await foods.removerRefeicaoFavorita(el.dataset.comboDel);
              haptic();
              const i = combos.findIndex(x => x.id === el.dataset.comboDel);
              if (i >= 0) combos.splice(i, 1);
              desenhar();
            }));
          };
          const ligarLinhas = raiz => {
            ligarCombos(raiz);
            qsa('[data-food]', raiz).forEach(el => el.addEventListener('click', async () => {
              const f = await foods.acharAlimento(el.dataset.food);
              if (f) escolherQuantidade(f);
            }));
            qsa('[data-fav]', raiz).forEach(el => el.addEventListener('click', async e => {
              e.stopPropagation();
              await foods.alternarFavorito(el.dataset.fav);
              haptic();
              desenhar();
            }));
          };

          async function desenhar() {
            const termo = campo.value.trim();

            // sem busca e sem filtro: mostra favoritos e recentes
            if (!termo && !categoria) {
              const favs = [];
              for (const id of favoritos.slice(0, 8)) {
                const f = await foods.acharAlimento(id);
                if (f) favs.push({ ...f, favorito: true });
              }
              area.innerHTML = `
                ${combos.length ? `
                  <div class="section-header"><span class="section-title">Refeições favoritas</span></div>
                  <div class="list">${combos.map(c => `
                    <div class="row">
                      <button class="row-body" data-combo="${esc(c.id)}" style="text-align:left;background:none;padding:0">
                        <div class="row-title">${icon('heart', 14)} ${esc(c.nome)}</div>
                        <div class="row-sub">${c.itens.length} ${c.itens.length === 1 ? 'item' : 'itens'} · ${foods.somar(c.itens).kcal} kcal</div>
                      </button>
                      <button class="row-chevron" data-combo-del="${esc(c.id)}" aria-label="Remover refeição favorita">${icon('trash', 15)}</button>
                    </div>`).join('')}</div>` : ''}
                ${recentes.length ? `
                  <div class="section-header"><span class="section-title">Consumidos recentemente</span></div>
                  <div class="list">${recentes.map(f =>
                    linhaAlimento({ ...f, favorito: favoritos.includes(f.id) })).join('')}</div>` : ''}
                ${favs.length ? `
                  <div class="section-header"><span class="section-title">Favoritos</span></div>
                  <div class="list">${favs.map(linhaAlimento).join('')}</div>` : ''}
                ${!recentes.length && !favs.length ? `
                  <p class="tiny muted center" style="padding:14px 0">
                    Digite o nome do alimento ou escolha uma categoria acima.<br>
                    Ex.: pão, ban, café, lei, fran.
                  </p>` : ''}`;
              ligarLinhas(area);
              return;
            }

            const lista = await foods.buscar(termo, { categoria });
            if (!lista.length) {
              area.innerHTML = `<p class="tiny muted center" style="padding:14px 0">
                Nenhum alimento encontrado. Use "Criar alimento próprio" abaixo.</p>`;
              return;
            }
            area.innerHTML = `<div class="list">${lista.map(linhaAlimento).join('')}</div>`;
            ligarLinhas(area);
          }

          campo.addEventListener('input', desenhar);
          qsa('[data-cat]', layer).forEach(b => b.addEventListener('click', () => {
            categoria = b.dataset.cat;
            qsa('[data-cat]', layer).forEach(x => x.classList.toggle('active', x === b));
            desenhar();
          }));
          desenhar();

          function escolherQuantidade(food) {
            const passo = foods.passoDe(food);
            let qtd = 1;

            area.innerHTML = `
              <div class="card">
                <div class="row-title">${esc(food.nome)}</div>
                <div class="row-sub" style="margin-bottom:14px">
                  ${food.kcal} kcal por 100 g · ${esc(food.cat)}
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
                         Aceita meia porção: 0,5 · 1,5 · 2,5…</p>` : ''}
                </div>

                <div class="card tight" id="qPrevia" style="background:var(--bg-elev-2)"></div>
                <button class="btn primary block mt-2" id="qConfirmar">Adicionar ao diário</button>
                <button class="btn ghost block mt-2" id="qVoltar">Voltar à busca</button>
              </div>`;

            const campoQtd = qs('#qCampo', area);
            const previa = qs('#qPrevia', area);
            const medidaBox = qs('#qMedida', area);

            const atualizar = () => {
              const m = foods.calcularPorQuantidade(food, qtd);
              medidaBox.textContent = foods.descreverMedida(food, qtd);
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
                </div>
                <div class="tiny muted" style="margin-top:8px">
                  Açúcar ${m.ac} g · Sódio ${m.sod} mg
                </div>`;
            };

            const definir = valor => {
              const limpo = Math.round(Math.max(passo, Math.min(99, valor)) / passo) * passo;
              qtd = +limpo.toFixed(1);
              campoQtd.value = foods.formatarQtd(qtd).replace(',', '.');
              atualizar();
            };

            qs('#qMenos', area).addEventListener('click', () => { definir(qtd - passo); haptic(); });
            qs('#qMais',  area).addEventListener('click', () => { definir(qtd + passo); haptic(); });
            campoQtd.addEventListener('input', () => {
              const v = parseFloat(String(campoQtd.value).replace(',', '.'));
              if (Number.isFinite(v) && v > 0) { qtd = v; atualizar(); }
            });
            campoQtd.addEventListener('blur', () => definir(qtd));
            qs('#qVoltar', area).addEventListener('click', desenhar);

            atualizar();

            qs('#qConfirmar', area).addEventListener('click', async () => {
              if (!(qtd > 0)) return toast('Informe uma quantidade maior que zero.');
              const m = foods.calcularPorQuantidade(food, qtd);
              await foods.registrarUso(food.id);
              await adicionarItem(refeicao, {
                nome: food.nome, foodId: food.id,
                qtd, medidaTexto: foods.descreverMedida(food, qtd),
                gramas: m.gramas, kcal: m.kcal, p: m.p, c: m.c, g: m.g, f: m.f,
                sod: m.sod, ac: m.ac
              });
              fechar();
            });
          }

          qs('#fManual', layer).addEventListener('click', () => {
            area.innerHTML = `
              <div class="card">
                <div class="field">
                  <label class="field-label" for="mNome">Nome do alimento</label>
                  <input class="input" id="mNome" placeholder="Ex.: Torta da vovó">
                </div>
                <div class="input-row" style="margin-bottom:12px">
                  <div class="grow"><label class="field-label" for="mMedida">Medida caseira</label>
                    <input class="input" id="mMedida" placeholder="fatia" value="porção"></div>
                  <div class="grow"><label class="field-label" for="mPorcao">Peso da medida (g)</label>
                    <input class="input" type="number" inputmode="numeric" id="mPorcao" value="100"></div>
                </div>
                <p class="tiny muted" style="margin-bottom:12px">
                  Os valores abaixo são por <strong>100 g</strong>, como no rótulo.
                </p>
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
                <div class="input-row" style="margin-bottom:12px">
                  <div class="grow"><label class="field-label" for="mFibra">Fibra (g)</label>
                    <input class="input" type="number" inputmode="decimal" id="mFibra" placeholder="g"></div>
                  <div class="grow"><label class="field-label" for="mAcucar">Açúcar (g)</label>
                    <input class="input" type="number" inputmode="decimal" id="mAcucar" placeholder="g"></div>
                </div>
                <div class="field">
                  <label class="field-label" for="mSodio">Sódio (mg)</label>
                  <input class="input" type="number" inputmode="numeric" id="mSodio" placeholder="mg">
                </div>
                <button class="btn primary block" id="mConfirmar">Salvar e usar</button>
                <button class="btn ghost block mt-2" id="mVoltar">Voltar à busca</button>
              </div>`;

            qs('#mVoltar', area).addEventListener('click', desenhar);
            qs('#mConfirmar', area).addEventListener('click', async () => {
              const num = sel => parseFloat(String(qs(sel, area).value).replace(',', '.')) || 0;
              try {
                const criado = await foods.criarAlimento({
                  nome: qs('#mNome', area).value.trim(),
                  medida: qs('#mMedida', area).value.trim() || 'porção',
                  porcao: num('#mPorcao') || 100,
                  kcal: num('#mKcal'), p: num('#mProt'), c: num('#mCarb'),
                  g: num('#mGord'), f: num('#mFibra'), ac: num('#mAcucar'), sod: num('#mSodio')
                });
                toast('Alimento criado', 'ok');
                escolherQuantidade(criado);
              } catch (err) {
                toast(err.message);
              }
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
