/* Evolução por Fotos — registro, linha do tempo e comparação entre datas. */
import { icon } from '../icons.js';
import { qs, qsa, esc, toast, haptic, fmtDate, sheet, empty } from '../ui.js';
import * as store from '../core/store.js';
import { PHOTO_SLOTS } from '../core/schema.js';
import { comprimirImagem, tamanhoKB } from '../core/image.js';
import { refresh } from '../router.js';

const nomeSlot = k => PHOTO_SLOTS.find(s => s.key === k)?.nome || k;

export default {
  title: 'Evolução por Fotos',
  subtitle: 'Seu progresso visual, só no seu aparelho',
  async render() {
    const sessoes = await store.listPhotoSessions();
    const total = sessoes.reduce((n, s) => n + s.total, 0);
    /* O card usa o último peso do APLICATIVO (módulo Peso, Medidas ou Fotos —
       todos gravam no mesmo lugar), não apenas o da última sessão fotográfica.
       Antes ele mostrava "—" mesmo com peso lançado em outro módulo. */
    const ultimo = await store.ultimoPeso();

    if (!sessoes.length) {
      return `
        <div class="card center" style="padding:32px 20px">
          <div style="color:var(--label-4);margin-bottom:14px">${icon('grid', 46)}</div>
          <div class="empty-title">Comece pelo Dia 0</div>
          <p class="empty-text" style="margin:8px 0 20px">
            A foto de hoje é a que você vai querer ver daqui a 90 dias.
            São quatro ângulos, leva menos de dois minutos.
          </p>
          <button class="btn primary block" id="novoRegistro">
            ${icon('plus', 19)} Criar meu primeiro registro
          </button>
        </div>
        <div class="callout tip">
          <span class="t">Como tirar</span>
          <p>Luz natural, sempre a mesma roupa e o mesmo local. Marque com fita
          onde você fica e onde apoia o celular — assim a comparação fica honesta.</p>
          <p>De manhã, em jejum, antes de comer.</p>
        </div>
        <div class="callout note">
          <span class="t">Privacidade</span>
          <p>As fotos ficam guardadas apenas neste aparelho. Não vão para
          nenhum servidor e não são compartilhadas automaticamente.</p>
        </div>`;
    }

    return `
      <div class="hstack" style="margin-bottom:14px">
        <button class="btn primary grow" id="novoRegistro">
          ${icon('plus', 19)} Novo registro
        </button>
        ${sessoes.length > 1
          ? `<button class="btn grow" id="compararBtn">${icon('grid', 19)} Comparar</button>`
          : ''}
      </div>

      <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div class="stat" style="padding:12px">
          <div class="stat-value" style="font-size:19px">${sessoes.length}</div>
          <div class="stat-label">Registros</div>
        </div>
        <div class="stat" style="padding:12px">
          <div class="stat-value" style="font-size:19px">${total}</div>
          <div class="stat-label">Fotos</div>
        </div>
        <div class="stat" style="padding:12px">
          <div class="stat-value" style="font-size:19px">
            ${ultimo ? esc(ultimo.kg) : '—'}<span class="stat-unit">kg</span>
          </div>
          <div class="stat-label">${ultimo ? 'Peso em ' + fmtDate(ultimo.date) : 'Último peso'}</div>
        </div>
      </div>

      <div class="section-header"><span class="section-title">Linha do tempo</span></div>
      <div class="timeline">
        ${[...sessoes].reverse().map((s, i, arr) => {
          const anterior = arr[i + 1];
          const delta = (anterior?.weight && s.weight)
            ? +(s.weight - anterior.weight).toFixed(1) : null;
          return `
          <article class="tl-item" data-abrir="${s.date}">
            <div class="tl-marker"></div>
            <div class="tl-card">
              <div class="spread">
                <div>
                  <div class="tl-date">${fmtDate(s.date, 'long')}</div>
                  <div class="tl-meta">
                    ${s.weight ? `<strong>${esc(s.weight)} kg</strong>` : 'Peso não informado'}
                    ${delta !== null
                      ? ` · <span class="${delta <= 0 ? 'delta-down' : 'delta-up'}">${delta > 0 ? '+' : ''}${delta} kg</span>`
                      : ''}
                    · ${s.total} de 4 fotos
                  </div>
                </div>
                <span class="row-chevron">${icon('chevron', 15)}</span>
              </div>
              <div class="tl-thumbs">
                ${PHOTO_SLOTS.map(slot => s.shots?.[slot.key]
                  ? `<img class="tl-thumb" src="${s.shots[slot.key]}" alt="${slot.nome}" loading="lazy">`
                  : `<div class="tl-thumb vazio" title="${slot.nome}">${icon('plus', 16)}</div>`).join('')}
              </div>
              ${s.note ? `<p class="tl-note selectable">${esc(s.note)}</p>` : ''}
            </div>
          </article>`;
        }).join('')}
      </div>

      <div class="callout note">
        <span class="t">Privacidade</span>
        <p>Suas fotos ficam apenas neste aparelho e entram no backup que você
        exporta. Nunca são enviadas para servidores nem compartilhadas sozinhas.</p>
      </div>`;
  },

  mount(root, params, ctx = {}) {
    const sig = { signal: ctx.signal };

    qs('#novoRegistro', root)?.addEventListener('click',
      () => abrirRegistro(store.dataDeTrabalho()), sig);

    qsa('[data-abrir]', root).forEach(el =>
      el.addEventListener('click', () => abrirRegistro(el.dataset.abrir), sig));

    qs('#compararBtn', root)?.addEventListener('click', abrirComparacao, sig);

    /* ---------------- registro de uma data ---------------- */
    async function abrirRegistro(date) {
      const rec = (await store.getPhotoSession(date)) || { date, shots: {}, note: '' };
      const existe = !!rec.createdAt;
      /* Pré-preenche com o peso já registrado para esta data em qualquer módulo.
         Se não houver, o campo fica livre para digitar — nunca bloqueado. */
      const pesoDoDia = await store.pesoDoDia(date);
      const ultimoConhecido = await store.ultimoPeso();

      sheet({
        title: existe ? 'Editar registro' : 'Novo registro',
        body: `
          <div class="field">
            <label class="field-label" for="pfData">Data</label>
            <input class="input" type="date" id="pfData" value="${esc(date)}">
          </div>
          <div class="field">
            <label class="field-label" for="pfPeso">Peso do dia (kg)</label>
            <input class="input" type="number" step="0.1" inputmode="decimal"
                   id="pfPeso" placeholder="${ultimoConhecido ? esc(ultimoConhecido.kg) : 'Ex.: 72,4'}"
                   value="${esc(pesoDoDia ?? '')}">
            <p class="tiny muted" style="margin:6px 0 0 4px" id="pfPesoOrigem">
              ${pesoDoDia
                ? 'Peso já registrado para esta data — editar aqui atualiza também o módulo Peso.'
                : ultimoConhecido
                  ? `Sem peso para esta data. O último foi ${ultimoConhecido.kg} kg em ${fmtDate(ultimoConhecido.date)}.`
                  : 'Nenhum peso registrado ainda. Informe aqui se quiser.'}
            </p>
          </div>
          <div class="field">
            <label class="field-label" for="pfNota">Observações</label>
            <textarea class="textarea" id="pfNota" style="min-height:60px"
                      placeholder="Como você se sente hoje?">${esc(rec.note || '')}</textarea>
          </div>

          <div class="section-header" style="margin-top:18px">
            <span class="section-title">Fotos</span>
          </div>
          <div class="shot-grid">
            ${PHOTO_SLOTS.map(slot => `
              <div class="shot" data-slot="${slot.key}">
                <div class="shot-frame">
                  ${rec.shots?.[slot.key]
                    ? `<img src="${rec.shots[slot.key]}" alt="${slot.nome}">`
                    : `<div class="shot-vazio">${icon('plus', 24)}</div>`}
                </div>
                <div class="shot-nome">${slot.nome}</div>
                <div class="shot-acoes">
                  <button class="btn sm" data-camera="${slot.key}">Câmera</button>
                  <button class="btn sm" data-galeria="${slot.key}">Galeria</button>
                  ${rec.shots?.[slot.key]
                    ? `<button class="btn sm danger" data-apagar="${slot.key}">Remover</button>` : ''}
                </div>
              </div>`).join('')}
          </div>

          <input type="file" accept="image/*" capture="environment" id="pfCamera" hidden>
          <input type="file" accept="image/*" id="pfGaleria" hidden>

          <button class="btn primary block" style="margin-top:18px" data-dismiss>Concluir</button>
          ${existe ? `<button class="btn ghost block danger mt-2" id="pfApagarTudo">
            Apagar este registro</button>` : ''}`,

        onMount(layer, fechar) {
          const dataEl = qs('#pfData', layer);
          let dataAtual = date;
          let slotAlvo = null;

          const salvarCampos = async () => {
            const peso = parseFloat(String(qs('#pfPeso', layer).value).replace(',', '.'));
            await store.savePhotoSession(dataAtual, {
              weight: Number.isFinite(peso) ? peso : null,
              note: qs('#pfNota', layer).value.trim()
            });
          };

          qs('#pfPeso', layer).addEventListener('change', salvarCampos);
          qs('#pfNota', layer).addEventListener('change', salvarCampos);

          dataEl.addEventListener('change', async () => {
            dataAtual = dataEl.value || store.dataDeTrabalho();
            const kg = await store.pesoDoDia(dataAtual);
            const campoPeso = qs('#pfPeso', layer);
            const aviso = qs('#pfPesoOrigem', layer);
            campoPeso.value = kg ?? '';
            if (aviso) {
              aviso.textContent = kg
                ? 'Peso já registrado para esta data — editar aqui atualiza também o módulo Peso.'
                : 'Sem peso registrado para esta data. Informe aqui se quiser.';
            }
          });

          const receber = async input => {
            const file = input.files?.[0];
            input.value = '';
            if (!file || !slotAlvo) return;
            try {
              toast('Processando a foto…');
              const dataURL = await comprimirImagem(file);
              await salvarCampos();
              await store.setPhotoShot(dataAtual, slotAlvo, dataURL);
              haptic();
              toast(`${nomeSlot(slotAlvo)} salva (${tamanhoKB(dataURL)} KB)`, 'ok');
              fechar();
              refresh();
            } catch (err) {
              console.error('[fotos]', err);
              toast(err.message || 'Não consegui salvar esta foto.');
            }
          };

          qs('#pfCamera', layer).addEventListener('change', e => receber(e.target));
          qs('#pfGaleria', layer).addEventListener('change', e => receber(e.target));

          qsa('[data-camera]', layer).forEach(b => b.addEventListener('click', () => {
            slotAlvo = b.dataset.camera; qs('#pfCamera', layer).click();
          }));
          qsa('[data-galeria]', layer).forEach(b => b.addEventListener('click', () => {
            slotAlvo = b.dataset.galeria; qs('#pfGaleria', layer).click();
          }));
          qsa('[data-apagar]', layer).forEach(b => b.addEventListener('click', async () => {
            await store.removePhotoShot(dataAtual, b.dataset.apagar);
            haptic(); toast('Foto removida');
            fechar(); refresh();
          }));

          qs('#pfApagarTudo', layer)?.addEventListener('click', async () => {
            await store.removePhotoSession(dataAtual);
            haptic(); toast('Registro apagado');
            fechar(); refresh();
          });
        }
      });
    }

    /* ---------------- comparar duas datas ---------------- */
    async function abrirComparacao() {
      const sessoes = await store.listPhotoSessions();
      const opcoes = sessoes.map(s =>
        `<option value="${s.date}">${fmtDate(s.date, 'long')}${s.weight ? ` — ${s.weight} kg` : ''}</option>`
      ).join('');

      sheet({
        title: 'Comparar registros',
        body: `
          <div class="input-row" style="margin-bottom:16px">
            <div class="grow">
              <label class="field-label" for="cmpA">Antes</label>
              <select class="select" id="cmpA">${opcoes}</select>
            </div>
            <div class="grow">
              <label class="field-label" for="cmpB">Depois</label>
              <select class="select" id="cmpB">${opcoes}</select>
            </div>
          </div>
          <div id="cmpResultado"></div>`,
        onMount(layer) {
          const a = qs('#cmpA', layer), b = qs('#cmpB', layer);
          a.value = sessoes[0].date;
          b.value = sessoes.at(-1).date;

          const desenhar = () => {
            const ra = sessoes.find(s => s.date === a.value);
            const rb = sessoes.find(s => s.date === b.value);
            if (!ra || !rb) return;
            const delta = (ra.weight && rb.weight) ? +(rb.weight - ra.weight).toFixed(1) : null;

            qs('#cmpResultado', layer).innerHTML = `
              ${delta !== null ? `
                <div class="card center" style="margin-bottom:14px">
                  <div class="stat-value" style="justify-content:center;color:${delta <= 0 ? 'var(--green)' : 'var(--label)'}">
                    ${delta > 0 ? '+' : ''}${delta}<span class="stat-unit">kg</span>
                  </div>
                  <div class="stat-label">Diferença entre as duas datas</div>
                </div>` : ''}
              ${PHOTO_SLOTS.map(slot => {
                const ia = ra.shots?.[slot.key], ib = rb.shots?.[slot.key];
                if (!ia && !ib) return '';
                return `
                  <div class="section-header"><span class="section-title">${slot.nome}</span></div>
                  <div class="cmp-par">
                    <figure>
                      ${ia ? `<img src="${ia}" alt="${slot.nome} antes">`
                           : `<div class="shot-vazio">sem foto</div>`}
                      <figcaption>Antes · ${fmtDate(ra.date)}</figcaption>
                    </figure>
                    <figure>
                      ${ib ? `<img src="${ib}" alt="${slot.nome} depois">`
                           : `<div class="shot-vazio">sem foto</div>`}
                      <figcaption>Depois · ${fmtDate(rb.date)}</figcaption>
                    </figure>
                  </div>`;
              }).join('') || `<p class="muted center">Nenhuma foto em comum entre estas datas.</p>`}`;
          };
          a.addEventListener('change', desenhar);
          b.addEventListener('change', desenhar);
          desenhar();
        }
      });
    }
  }
};
