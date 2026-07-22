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
    const refeicoes = (await store.getDaily('meals', store.dataDeTrabalho()))?.value || {};
    const itensHoje = ['breakfast','snack1','lunch','snack2','dinner','supper']
      .flatMap(k => refeicoes[k]?.itens || []);
    const totalDia = foods.somar(itensHoje);
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

      <div class="section-header"><span class="section-title">Alimentação de hoje</span></div>
      <a class="card" href="#/alimentacao" style="display:block;text-decoration:none;color:inherit">
        <div class="spread" style="margin-bottom:10px">
          <div><div class="card-title" style="font-size:15px">${icon('meal', 18)} Diário alimentar</div>
            <div class="card-sub">${itensHoje.length
              ? `${itensHoje.length} ${itensHoje.length === 1 ? 'item' : 'itens'} registrados`
              : 'Nada registrado ainda'}</div></div>
          <span class="chip ${totalDia.kcal > metaKcal ? 'red' : totalDia.kcal >= metaKcal * 0.7 ? 'green' : 'accent'}">
            ${totalDia.kcal} / ${metaKcal} kcal</span>
        </div>
        <div class="bar" style="margin-bottom:12px">
          <div class="bar-fill" style="width:${Math.min(Math.round(totalDia.kcal / metaKcal * 100), 100)}%"></div>
        </div>
        <div class="macro-grid">
          <div class="macro"><div class="macro-v">${totalDia.p}<small>g</small></div><div class="macro-l">Proteína</div></div>
          <div class="macro"><div class="macro-v">${totalDia.c}<small>g</small></div><div class="macro-l">Carbo</div></div>
          <div class="macro"><div class="macro-v">${totalDia.g}<small>g</small></div><div class="macro-l">Gordura</div></div>
          <div class="macro"><div class="macro-v">${totalDia.f}<small>g</small></div><div class="macro-l">Fibra</div></div>
        </div>
      </a>

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
