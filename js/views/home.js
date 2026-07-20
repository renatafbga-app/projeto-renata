import { icon } from '../icons.js';
import { ring, esc } from '../ui.js';
import * as store from '../core/store.js';
import * as stats from '../core/stats.js';
import * as foods from '../core/foods.js';
import { AI } from '../core/adapters.js';
import * as notif from '../core/notifications.js';

export default {
  title: 'Início',
  subtitle: 'Bom te ver de novo',
  async render() {
    const o = await stats.overview();
    const t = await stats.today();
    const d = t.day;
    const done = store.isDayComplete(d.day);
    const insight = await AI.insight({
      knee: t.knee, streak: o.streak, waterPct: t.waterPct, lost: o.lost
    });
    const due = await notif.dueReminders();
    // resumo alimentar do dia para o registro rápido
    const refeicoes = (await store.getDaily('meals', store.todayISO()))?.value || {};
    const itensHoje = ['breakfast','snack1','lunch','snack2','dinner','supper']
      .flatMap(k => refeicoes[k]?.itens || []);
    const kcalHoje = foods.somar(itensHoje).kcal;
    const metaKcal = store.getSettings().calorieGoal;

    return `
      ${due.length ? `
        <div class="reminder">
          ${icon('bell', 20)}
          <div class="grow"><div class="t">${esc(due[0].title)}</div>
          <div class="s">${esc(due[0].body)}</div></div>
        </div>` : ''}

      <section class="hero">
        <div class="hero-kicker">DIA ${d.day} · SEMANA ${d.week} · ${esc(d.blockname)}</div>
        <div class="hero-title">${esc(d.title)}</div>
        <div class="hero-sub">${esc(d.foco)} · ${esc(d.time)} · ~${d.kcal} kcal</div>
        <div class="hero-actions">
          <a class="btn primary" href="#/sessao/${d.day}">
            ${icon(done ? 'check' : 'play', 19)} ${done ? 'Treino feito' : 'Iniciar treino'}
          </a>
          <a class="btn" href="#/treinos/dia/${d.day}">Ver detalhes</a>
        </div>
      </section>

      <div class="card">
        <div class="rings">
          <div class="ring-item">${ring({ value: o.percent, max: 100, label: 'PROGRAMA', unit: '%' })}</div>
          <div class="ring-item">${ring({ value: o.daysDone, max: 90, label: 'DIAS' })}</div>
          <div class="ring-item">${ring({ value: t.waterPct, max: 100, label: 'ÁGUA', unit: '%' })}</div>
        </div>
      </div>

      <div class="callout tip"><span class="t">Seu momento</span>${esc(insight)}</div>

      <div class="section-header"><span class="section-title">Resumo</span></div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-value">${o.streak}<span class="stat-unit">dias</span></div>
          <div class="stat-label">Sequência atual</div></div>
        <div class="stat"><div class="stat-value">${o.lost}<span class="stat-unit">kg</span></div>
          <div class="stat-label">Peso eliminado</div></div>
        <div class="stat"><div class="stat-value">${o.daysLeft}</div>
          <div class="stat-label">Dias restantes</div></div>
        <div class="stat"><div class="stat-value">${o.longestStreak}<span class="stat-unit">dias</span></div>
          <div class="stat-label">Maior sequência</div></div>
      </div>

      <div class="section-header"><span class="section-title">Registro rápido</span></div>
      <div class="list">
        <a class="row" href="#/agua">
          <div class="row-icon" style="background:rgba(10,132,255,.18);color:#4FC3F7">${icon('drop', 18)}</div>
          <div class="row-body"><div class="row-title">Água</div>
            <div class="row-sub">${t.water} ml de ${t.waterGoal} ml</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/peso">
          <div class="row-icon tint">${icon('scale', 18)}</div>
          <div class="row-body"><div class="row-title">Peso</div>
            <div class="row-sub">${o.currentWeight ? o.currentWeight + ' kg' : 'Sem registro ainda'}</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/joelho">
          <div class="row-icon" style="background:rgba(255,69,58,.18);color:#FF453A">${icon('knee', 18)}</div>
          <div class="row-body"><div class="row-title">Dor no joelho</div>
            <div class="row-sub">${t.knee != null ? t.knee + '/10 hoje' : 'Não registrado hoje'}</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/alimentacao">
          <div class="row-icon" style="background:rgba(255,214,10,.18);color:#FFD60A">${icon('meal', 18)}</div>
          <div class="row-body"><div class="row-title">Alimentação</div>
            <div class="row-sub">${itensHoje.length
              ? `${kcalHoje} de ${metaKcal} kcal · ${itensHoje.length} ${itensHoje.length === 1 ? 'item' : 'itens'} hoje`
              : 'Nada registrado hoje'}</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/fotos">
          <div class="row-icon" style="background:rgba(191,90,242,.18);color:#BF5AF2">${icon('grid', 18)}</div>
          <div class="row-body"><div class="row-title">Evolução por fotos</div>
            <div class="row-sub">Registre seu progresso visual</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
        <a class="row" href="#/humor">
          <div class="row-icon teal">${icon('smile', 18)}</div>
          <div class="row-body"><div class="row-title">Humor</div>
            <div class="row-sub">${t.mood?.emoji ? t.mood.emoji + ' registrado hoje' : 'Não registrado hoje'}</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></a>
      </div>`;
  }
};
