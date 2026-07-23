import { icon } from '../icons.js';
import { lineChart, empty } from '../ui.js';
import * as store from '../core/store.js';
import * as stats from '../core/stats.js';

export default {
  title: 'Meu Progresso', subtitle: 'Tudo o que você construiu',
  async render() {
    const o = await stats.overview();
    const weights = await store.series('weight', v => v?.kg);
    const knee = await store.series('knee', v => v?.level);
    const done = new Set(store.getProgress().completedDays);
    const pm = await stats.progressoPorModulo();
    const cur = store.currentDay();

    const S = [
      { v: o.daysDone, l: 'Dias treinados' },
      { v: o.daysLeft, l: 'Dias restantes' },
      { v: o.streak, u: 'dias', l: 'Sequência atual' },
      { v: o.longestStreak, u: 'dias', l: 'Maior sequência' },
      { v: o.lost, u: 'kg', l: 'Peso eliminado' },
      { v: o.volume.toLocaleString('pt-BR'), u: 'kg', l: 'Carga total' },
      { v: o.hours, u: 'h', l: 'Horas treinadas' },
      { v: o.kcal.toLocaleString('pt-BR'), u: 'kcal', l: 'Calorias' }
    ];

    return `
      <div class="card accent">
        <div class="spread">
          <div><div class="card-title" style="color:#fff;font-size:32px;letter-spacing:-1px">${o.percent}%</div>
            <div class="card-sub">do programa concluído</div></div>
          <div style="text-align:right">
            <div style="font-size:15px;font-weight:600">
              ${o.toGoal > 0 ? `Faltam ${o.toGoal} kg` : 'Meta alcançada!'}</div>
            <div class="card-sub">para os ${o.goalWeight} kg</div></div>
        </div>
        <div class="bar lg" style="margin-top:14px;background:rgba(255,255,255,.25)">
          <div class="bar-fill" style="width:${o.percent}%;background:#fff"></div></div>
      </div>

      <div class="section-header"><span class="section-title">Progresso por frente</span></div>
      <div class="list">
        <a class="row" href="#/treinos">
          <div class="row-icon tint">${icon('dumbbell', 18)}</div>
          <div class="row-body"><div class="row-title">Treino</div>
            <div class="row-sub">Dia ${pm.treino.dia}/${pm.treino.total} do desafio</div>
            <div class="bar" style="margin-top:6px;height:5px"><div class="bar-fill" style="width:${Math.round(pm.treino.dia/pm.treino.total*100)}%"></div></div>
          </div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/alimentacao">
          <div class="row-icon" style="background:rgba(255,214,10,.18);color:#FFD60A">${icon('meal', 18)}</div>
          <div class="row-body"><div class="row-title">Alimentação</div>
            <div class="row-sub">Dia ${pm.alimentacao.dia}/${pm.alimentacao.total} com registro</div>
            <div class="bar" style="margin-top:6px;height:5px"><div class="bar-fill" style="width:${Math.round(pm.alimentacao.dia/pm.alimentacao.total*100)}%"></div></div>
          </div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/agua">
          <div class="row-icon" style="background:rgba(10,132,255,.18);color:#4FC3F7">${icon('drop', 18)}</div>
          <div class="row-body"><div class="row-title">Água</div>
            <div class="row-sub">Hoje: ${pm.agua.ml} de ${pm.agua.meta} ml · registro diário</div>
            <div class="bar teal" style="margin-top:6px;height:5px"><div class="bar-fill" style="width:${pm.agua.pct}%"></div></div>
          </div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
      </div>

      <div class="section-header"><span class="section-title">Evolução do peso</span></div>
      <div class="card">${weights.length > 1 ? lineChart(weights)
        : empty('scale', 'Sem gráfico ainda', 'Registre seu peso em pelo menos duas datas.')}</div>

      <div class="section-header"><span class="section-title">Dor no joelho</span></div>
      <div class="card">${knee.length > 1 ? lineChart(knee) +
        `<p class="tiny muted center">Quanto menor, melhor — o fortalecimento está funcionando.</p>`
        : empty('knee', 'Sem gráfico ainda', 'Registre a dor em pelo menos duas datas.')}</div>

      <div class="section-header"><span class="section-title">Estatísticas</span></div>
      <div class="stat-grid">
        ${S.map(s => `<div class="stat">
          <div class="stat-value">${s.v}${s.u ? `<span class="stat-unit">${s.u}</span>` : ''}</div>
          <div class="stat-label">${s.l}</div></div>`).join('')}
      </div>

      <div class="section-header"><span class="section-title">Calendário dos 90 dias</span></div>
      <div class="card">
        <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:5px">
          ${Array.from({ length: 90 }, (_, i) => {
            const d = i + 1, isDone = done.has(d), isToday = d === cur && !isDone;
            return `<div style="aspect-ratio:1;border-radius:5px;display:grid;place-items:center;
              font-size:9px;font-weight:600;
              background:${isDone ? 'var(--green)' : isToday ? 'var(--accent)' : 'var(--fill)'};
              color:${isDone || isToday ? '#fff' : 'var(--label-3)'}">${d}</div>`;
          }).join('')}
        </div>
      </div>`;
  }
};
