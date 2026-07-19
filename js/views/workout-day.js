import { icon } from '../icons.js';
import { esc, fmtDate, fmtTime } from '../ui.js';
import { PROGRAM } from '../../data/program.data.js';
import { EXERCISES } from '../../data/exercises.data.js';
import { figure } from '../../data/figures.data.js';
import { acharAlongamento } from '../../data/stretches.data.js';
import * as store from '../core/store.js';

const byKey = k => EXERCISES.find(e => e.key === k);
const MOOD = { '😀': 'Ótima', '🙂': 'Bem', '😐': 'Neutra', '😞': 'Pra baixo', '😴': 'Cansada' };

export default {
  compact: true, backLabel: 'Treinos',
  title: p => `Dia ${p.n}`,
  async render(p) {
    const day = +p.n;
    const d = PROGRAM.find(x => x.day === day);
    if (!d) return `<div class="empty"><div class="empty-title">Dia não encontrado</div></div>`;
    const log = await store.getWorkout(day);
    const done = store.isDayComplete(day);

    /* Histórico do dia, quando já executado */
    const history = (done && log) ? `
      <div class="section-header"><span class="section-title">O que você fez</span></div>
      <div class="card">
        <div class="spread" style="margin-bottom:10px">
          <span class="chip green">${icon('check', 14)} Concluído</span>
          <span class="row-sub">${log.finishedAt ? fmtDate(log.finishedAt.slice(0, 10), 'long') : ''}</span>
        </div>
        <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);gap:8px">
          <div class="stat" style="padding:10px"><div class="stat-value" style="font-size:16px">${fmtTime(log.durationSec || 0)}</div><div class="stat-label">Duração</div></div>
          <div class="stat" style="padding:10px"><div class="stat-value" style="font-size:16px">${log.kcal || 0}</div><div class="stat-label">kcal</div></div>
          <div class="stat" style="padding:10px"><div class="stat-value" style="font-size:16px">${log.checkin?.pain ?? '—'}</div><div class="stat-label">Dor</div></div>
        </div>
        ${log.checkin?.mood ? `<p class="tiny muted mt-2">Humor: ${log.checkin.mood} ${MOOD[log.checkin.mood] || ''}${log.checkin.energy ? ` · Energia ${log.checkin.energy}/5` : ''}</p>` : ''}
        ${log.checkin?.note ? `<p class="tiny mt-2 selectable">"${esc(log.checkin.note)}"</p>` : ''}
      </div>
      ${(log.exercises || []).filter(e => (e.sets || []).some(s => s.done)).map(e => `
        <div class="card tight">
          <div class="row-title">${esc(byKey(e.key)?.nome || e.key)}</div>
          <div class="row-sub">${e.sets.filter(s => s.done)
            .map(s => `${s.weight || '—'} kg × ${s.reps || '—'}`).join(' · ')}</div>
          ${e.note ? `<div class="tiny muted mt-2 selectable">${esc(e.note)}</div>` : ''}
        </div>`).join('')}` : '';

    return `
      <div class="hero" style="margin-bottom:16px">
        <div class="hero-kicker">DIA ${d.day} · SEMANA ${d.week} · BLOCO ${d.block} — ${esc(d.blockname)}</div>
        <div class="hero-title">${esc(d.title)}</div>
        <div class="hero-sub">${esc(d.foco)}</div>
      </div>

      <div class="stat-grid" style="grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div class="stat" style="padding:12px"><div class="stat-value" style="font-size:16px">${esc(d.time)}</div><div class="stat-label">Tempo</div></div>
        <div class="stat" style="padding:12px"><div class="stat-value" style="font-size:16px">${d.kcal}</div><div class="stat-label">kcal</div></div>
        <div class="stat" style="padding:12px"><div class="stat-value" style="font-size:16px">${d.exercises.length}</div><div class="stat-label">Exercícios</div></div>
      </div>

      <div class="section-header"><span class="section-title">Aquecimento</span></div>
      <div class="card tight"><div class="tiny muted">${esc(d.warmup)}</div></div>

      ${d.exercises.length ? `
        <div class="section-header"><span class="section-title">Exercícios</span></div>
        ${d.exercises.map(ex => {
          const info = byKey(ex.key);
          return `<a class="card tight hstack" href="#/biblioteca/${info?.id || ''}" style="text-decoration:none;color:inherit">
            <div class="ex-thumb" style="width:52px;height:52px">${figure(ex.key)}</div>
            <div class="grow"><div class="row-title">${esc(ex.nome)}</div>
              <div class="row-sub">Descanso ${esc(ex.rest)}</div></div>
            <div style="text-align:right"><div style="font-weight:700;color:var(--accent)">${ex.sets} × ${esc(ex.reps)}</div>
              <div class="row-sub" style="font-size:10px">SÉRIES × REP</div></div></a>`;
        }).join('')}` : ''}

      ${d.cardio ? `<div class="section-header"><span class="section-title">Cardio</span></div>
        <div class="card tight"><div class="tiny">${esc(d.cardio)}</div></div>` : ''}

      <div class="section-header">
        <span class="section-title">Alongamento final</span>
        <a class="section-action" href="#/alongamentos">Ver todos</a>
      </div>
      <div class="list">
        ${(d.stretches || []).map(k => {
          const a = acharAlongamento(k);
          if (!a) return '';
          return `<a class="row" href="#/alongamentos/${a.id}">
            <div class="ex-thumb" style="width:42px;height:42px">${figure(a.key)}</div>
            <div class="row-body">
              <div class="row-title">${esc(a.curto)}</div>
              <div class="row-sub">${esc(a.tempo)}</div>
            </div>
            <span class="chip accent">Ver como fazer</span>
          </a>`;
        }).join('')}
      </div>

      ${history}
      <div style="height:12px"></div>
      <a class="btn primary block" href="#/sessao/${d.day}">
        ${icon(done ? 'check' : 'play', 19)} ${done ? 'Refazer este treino' : 'Iniciar treino'}</a>`;
  }
};
