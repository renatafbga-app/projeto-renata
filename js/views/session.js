/* ============================================================================
 * SESSÃO DE TREINO — tudo salva sozinho, a cada digitação.
 * Se o app fechar no meio do treino, ao reabrir tudo está onde estava.
 * ========================================================================== */
import { icon } from '../icons.js';
import { qs, qsa, esc, toast, haptic, fmtTime, sheet } from '../ui.js';
import { PROGRAM } from '../../data/program.data.js';
import { figure } from '../../data/figures.data.js';
import { acharAlongamento } from '../../data/stretches.data.js';
import * as store from '../core/store.js';
import { flashSaved } from '../core/autosave.js';
import * as notif from '../core/notifications.js';

let restTimer = null, clockTimer = null;
const parseRest = r => (String(r).match(/(\d+)/) || [, 45])[1] * 1;

export default {
  compact: true, backLabel: 'Sair',
  title: p => `Treino · Dia ${p.n}`,
  async render(p) {
    const day = +p.n;
    const d = PROGRAM.find(x => x.day === day);
    if (!d) return `<div class="empty"><div class="empty-title">Dia não encontrado</div></div>`;

    const planned = d.exercises.length ? d.exercises
      : [{ key: 'march', nome: 'Caminhada leve', sets: 1, reps: '20 min', rest: '—' }];

    // Estado salvo (retomada) + sugestão de carga do histórico
    const log = await store.getWorkout(day);
    const saved = new Map((log?.exercises || []).map(e => [e.key, e]));
    const sugg = {};
    for (const ex of planned) sugg[ex.key] = await store.loadStats(ex.key);

    return `
      <div class="spread" style="margin-bottom:12px">
        <div><div class="tiny muted">DIA ${d.day} · ${esc(d.blockname)}</div>
          <div style="font-size:23px;font-weight:700;letter-spacing:-.5px">${esc(d.title)}</div></div>
        <div style="text-align:right">
          <div class="chip accent" id="sessProgress">0 / ${planned.length}</div>
          <div class="tiny muted mono mt-2" id="sessClock">00:00</div></div>
      </div>
      <div class="bar" style="margin-bottom:16px"><div class="bar-fill" id="sessBar" style="width:0%"></div></div>

      <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
        <div class="stat" style="padding:11px">
          <div class="stat-value" style="font-size:15px">${esc(d.time)}</div>
          <div class="stat-label">Tempo estimado</div>
        </div>
        <div class="stat" style="padding:11px">
          <div class="stat-value" style="font-size:15px">~${d.kcal}<span class="stat-unit">kcal</span></div>
          <div class="stat-label">Calorias</div>
        </div>
        <div class="stat" style="padding:11px">
          <div class="stat-value" style="font-size:15px">${planned.length}</div>
          <div class="stat-label">Exercícios</div>
        </div>
      </div>

      <div class="card tight" style="margin-bottom:14px">
        <div class="card-title" style="font-size:15px">${icon('bolt', 18)} Aquecimento</div>
        <div class="card-sub">${esc(d.warmup)}</div>
      </div>

      ${planned.map((ex, i) => {
        const prev = saved.get(ex.key);
        const s = sugg[ex.key];
        const hint = s.count
          ? `Última ${s.last} kg · sugestão <strong>${s.suggestion} kg</strong>`
          : 'Primeira vez — comece leve e sinta o movimento';
        return `
        <article class="ex-card ${prev?.sets?.every(x => x.done) ? 'done' : ''}" data-ex="${i}" data-key="${ex.key}">
          <div class="ex-head">
            <div class="ex-thumb">${figure(ex.key)}</div>
            <div class="grow">
              <div class="ex-name">${esc(ex.nome)}</div>
              <div class="ex-meta">${ex.sets} × ${esc(ex.reps)} · descanso ${esc(ex.rest)}</div>
              <div class="ex-meta" style="color:var(--accent)">${hint}</div>
            </div>
            <button class="ex-check" data-toggle="${i}" aria-label="Concluir exercício">${icon('check', 16)}</button>
          </div>
          <div class="set-table">
            <div class="set-row set-head"><span></span><span>Carga (kg)</span><span>Reps</span><span></span></div>
            ${Array.from({ length: ex.sets }, (_, k) => {
              const ps = prev?.sets?.[k] || {};
              return `<div class="set-row">
                <span class="idx">${k + 1}</span>
                <input class="input" type="number" step="0.5" inputmode="decimal"
                  placeholder="${s.suggestion ?? '—'}" value="${ps.weight ?? ''}" data-w="${i}-${k}">
                <input class="input" type="number" inputmode="numeric"
                  placeholder="${esc(String(ex.reps).replace(/[^\d]/g, '').slice(0, 2) || '')}"
                  value="${ps.reps ?? ''}" data-r="${i}-${k}">
                <button class="set-done ${ps.done ? 'on' : ''}" data-set="${i}-${k}"
                  data-rest="${parseRest(ex.rest)}" aria-label="Concluir série">${icon('check', 15)}</button>
              </div>`;
            }).join('')}
          </div>
          <textarea class="textarea" style="min-height:50px;margin-top:10px"
            placeholder="Observações deste exercício…" data-note="${i}">${esc(prev?.note || '')}</textarea>
        </article>`;
      }).join('')}

      <div class="section-header">
        <span class="section-title">Alongamento final</span>
        <a class="section-action" href="#/alongamentos">Ver todos</a>
      </div>
      <div class="list">
        ${(d.stretches || []).map(k => {
          const a = acharAlongamento(k);
          if (!a) return '';
          return `<a class="row" href="#/alongamentos/${a.id}">
            <div class="ex-thumb" style="width:38px;height:38px">${figure(a.key)}</div>
            <div class="row-body">
              <div class="row-title">${esc(a.curto)}</div>
              <div class="row-sub">${esc(a.tempo)}</div>
            </div>
            <span class="chip accent">Ver como fazer</span>
          </a>`;
        }).join('')}
      </div>

      <button class="btn primary block" id="finishBtn" style="margin-top:8px">
        ${icon('trophy', 19)} Finalizar treino</button>
      <p class="tiny muted center mt-2">Tudo é salvo automaticamente enquanto você treina.</p>`;
  },

  mount(root, p, ctx = {}) {
    const day = +p.n;
    const d = PROGRAM.find(x => x.day === day);
    const cards = qsa('[data-ex]', root);
    const total = cards.length;
    const startedAt = Date.now();

    /* ---------- cronômetro do treino ---------- */
    clockTimer = setInterval(() => {
      const el = qs('#sessClock', root);
      if (el) el.textContent = fmtTime(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    /* ---------- coleta e persistência ---------- */
    const collect = () => cards.map(card => {
      const i = card.dataset.ex;
      const sets = qsa(`[data-set^="${i}-"]`, card).map((btn, k) => ({
        weight: qs(`[data-w="${i}-${k}"]`, card)?.value || '',
        reps:   qs(`[data-r="${i}-${k}"]`, card)?.value || '',
        done:   btn.classList.contains('on')
      }));
      return { key: card.dataset.key, sets, note: qs(`[data-note="${i}"]`, card)?.value || '' };
    });

    let saveTimer;
    const persist = (immediate = false) => {
      clearTimeout(saveTimer);
      const run = async () => {
        await store.saveWorkout(day, { exercises: collect(), status: 'in_progress' });
        flashSaved();
      };
      immediate ? run() : (saveTimer = setTimeout(run, 450));
    };

    root.addEventListener('input', e => {
      if (e.target.matches('[data-w],[data-r],[data-note]')) persist();
    });

    const sync = () => {
      const done = qsa('.ex-card.done', root).length;
      qs('#sessProgress', root).textContent = `${done} / ${total}`;
      qs('#sessBar', root).style.width = `${(done / total) * 100}%`;
    };
    sync();

    qsa('[data-toggle]', root).forEach(btn => btn.addEventListener('click', () => {
      const card = btn.closest('.ex-card');
      const on = card.classList.toggle('done');
      qsa('[data-set]', card).forEach(b => b.classList.toggle('on', on));
      haptic(); sync(); persist(true);
    }));

    qsa('[data-set]', root).forEach(btn => btn.addEventListener('click', () => {
      btn.classList.toggle('on'); haptic();
      if (btn.classList.contains('on')) startRest(+btn.dataset.rest);
      const card = btn.closest('.ex-card');
      card.classList.toggle('done', qsa('[data-set]', card).every(b => b.classList.contains('on')));
      sync(); persist(true);
    }));

    /* ---------- descanso ---------- */
    function startRest(sec) {
      stopRest();
      let left = sec;
      const bar = document.createElement('div');
      bar.className = 'rest-bar';
      bar.innerHTML = `
        <div class="rest-main">
          <div>
            <div class="rest-label">Descanso</div>
            <div class="rest-time" id="restTime">${fmtTime(left)}</div>
          </div>
          <div class="grow"></div>
          <button class="btn sm" id="restMais">+30 s</button>
          <button class="btn sm" id="restSkip">Pular</button>
        </div>
        <div class="rest-presets">
          ${[30, 60, 90].map(v => `<button class="rest-preset" data-preset="${v}">${v} s</button>`).join('')}
          <button class="rest-preset" data-preset="custom">Outro</button>
        </div>`;
      document.body.appendChild(bar);

      const mostrar = () => {
        const t = qs('#restTime');
        if (t) t.textContent = fmtTime(Math.max(left, 0));
      };

      qs('#restSkip', bar).addEventListener('click', stopRest);
      qs('#restMais', bar).addEventListener('click', () => { left += 30; mostrar(); haptic(); });

      qsa('[data-preset]', bar).forEach(b => b.addEventListener('click', () => {
        if (b.dataset.preset === 'custom') {
          const entrada = prompt('Descanso em segundos:', String(left > 0 ? left : 60));
          const v = parseInt(entrada, 10);
          if (Number.isFinite(v) && v > 0 && v <= 900) { left = v; mostrar(); haptic(); }
          return;
        }
        left = Number(b.dataset.preset);
        mostrar(); haptic();
      }));

      restTimer = setInterval(() => {
        left--;
        mostrar();
        if (left <= 0) { stopRest(); haptic(80); toast('Descanso terminado', 'ok'); }
      }, 1000);
    }
    function stopRest() { clearInterval(restTimer); restTimer = null; document.querySelector('.rest-bar')?.remove(); }

    /* ---------- finalização ---------- */
    qs('#finishBtn', root).addEventListener('click', async () => {
      await store.saveWorkout(day, { exercises: collect() });
      const durationSec = Math.floor((Date.now() - startedAt) / 1000);
      const doneCount = qsa('.ex-card.done', root).length;

      sheet({
        title: 'Como foi o treino?',
        body: `
          <p class="muted" style="margin-bottom:14px">${doneCount} de ${total} exercícios ·
            ${fmtTime(durationSec)} de duração</p>
          <div class="field"><label class="field-label">Dor no joelho (0–10)</label>
            <div class="pain-scale">${Array.from({ length: 11 }, (_, i) =>
              `<button class="pain-dot" data-pain="${i}">${i}</button>`).join('')}</div></div>
          <div class="field"><label class="field-label">Como você se sentiu</label>
            <div class="mood-row">${['😀','🙂','😐','😞','😴'].map(m =>
              `<button class="mood-btn" data-mood="${m}">${m}</button>`).join('')}</div></div>
          <div class="field"><label class="field-label">Energia (1–5)</label>
            <div class="mood-row">${[1,2,3,4,5].map(n =>
              `<button class="mood-btn" data-energy="${n}" style="font-size:16px;font-weight:700">${n}</button>`).join('')}</div></div>
          <div class="field"><label class="field-label">Observações</label>
            <textarea class="textarea" id="finNote" placeholder="Como foi hoje?"></textarea></div>
          <button class="btn primary block" id="finConfirm">Finalizar e salvar</button>`,
        onMount(layer, close) {
          const pick = (sel, attr) => qsa(sel, layer).forEach(b => b.addEventListener('click', () => {
            qsa(sel, layer).forEach(x => { x.classList.remove('active'); if (attr === 'pain') x.style.background = ''; });
            b.classList.add('active'); haptic();
            if (attr === 'pain') {
              const v = +b.dataset.pain;
              b.style.background = v <= 3 ? 'var(--green)' : v <= 6 ? 'var(--yellow)' : 'var(--red)';
              b.style.color = '#fff';
            }
          }));
          pick('[data-pain]', 'pain'); pick('[data-mood]'); pick('[data-energy]');

          qs('#finConfirm', layer).addEventListener('click', async () => {
            const checkin = {
              pain:   +(qs('[data-pain].active', layer)?.dataset.pain ?? 0),
              mood:    qs('[data-mood].active', layer)?.dataset.mood || '',
              energy: +(qs('[data-energy].active', layer)?.dataset.energy ?? 0),
              note:    qs('#finNote', layer)?.value || ''
            };
            await store.finishWorkout(day, { durationSec, kcal: d.kcal, checkin });
            // espelha o check-in nos módulos de acompanhamento
            const today = store.todayISO();
            if (checkin.pain != null) await store.setDaily('knee', today, { level: checkin.pain }, checkin.note);
            if (checkin.mood) await store.setDaily('mood', today, { emoji: checkin.mood });
            notif.cancelWorkoutReminders();
            close();
            toast('Treino salvo. Próximo dia liberado!', 'ok');
            location.hash = '/treinos';
          });
        }
      });
    });

    /* ---------- limpeza ao sair ---------- */
    const cleanup = () => { clearInterval(clockTimer); stopRest(); persist(true); };
    window.addEventListener('pagehide', cleanup, { signal: ctx.signal });
    // ao sair da sessão o router aborta o signal: paramos os cronômetros e
    // gravamos o que estiver pendente, sem depender de eventos do navegador
    ctx.signal?.addEventListener('abort', cleanup, { once: true });
  }
};
