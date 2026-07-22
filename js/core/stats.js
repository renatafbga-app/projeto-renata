/* ============================================================================
 * STATS — todas as estatísticas derivam dos dados brutos, nunca são gravadas.
 * Assim não existe risco de número "salvo" divergir da realidade.
 * ========================================================================== */
import * as store from './store.js';
import { PROGRAM } from '../../data/program.data.js';

/** Maior sequência de dias consecutivos concluídos (por número do dia). */
function streaks(days) {
  if (!days.length) return { current: 0, longest: 0 };
  const s = [...days].sort((a, b) => a - b);
  let longest = 1, run = 1;
  for (let i = 1; i < s.length; i++) {
    run = s[i] === s[i - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  // sequência atual = run que termina no último dia concluído
  let current = 1;
  for (let i = s.length - 1; i > 0; i--) {
    if (s[i] === s[i - 1] + 1) current++; else break;
  }
  return { current, longest };
}

export async function overview() {
  const progress = store.getProgress();
  const settings = store.getSettings();
  const done = progress.completedDays;
  const workouts = await store.listWorkouts();
  const weights = await store.series('weight');

  const { current, longest } = streaks(done);
  const totalSec = workouts.reduce((s, w) => s + (w.durationSec || 0), 0);
  const kcal = workouts.reduce((s, w) => s + (w.kcal || 0), 0);

  // Volume total = Σ carga × repetições de todas as séries concluídas
  let volume = 0;
  for (const w of workouts)
    for (const ex of w.exercises || [])
      for (const st of ex.sets || [])
        if (st.done) volume += (Number(st.weight) || 0) * (Number(st.reps) || 0);

  const startW = weights[0]?.v ?? settings.startWeight;
  const curW = weights.at(-1)?.v ?? settings.startWeight;

  return {
    daysDone: done.length,
    daysLeft: 90 - done.length,
    percent: Math.round((done.length / 90) * 100),
    streak: current,
    longestStreak: longest,
    hours: +(totalSec / 3600).toFixed(1),
    kcal,
    volume: Math.round(volume),
    currentWeight: curW,
    startWeight: startW,
    goalWeight: settings.goalWeight,
    lost: +(startW - curW).toFixed(1),
    toGoal: +(curW - settings.goalWeight).toFixed(1),
    currentDay: store.currentDay(),
    imc: settings.heightCm ? +(curW / Math.pow(settings.heightCm / 100, 2)).toFixed(1) : null
  };
}

/** Resumo do dia de hoje para a tela Início. */
export async function today() {
  const date = store.dataDeTrabalho();
  const water = (await store.getDaily('water', date))?.value?.ml || 0;
  const mood  = (await store.getDaily('mood',  date))?.value || null;
  const knee  = (await store.getDaily('knee',  date))?.value?.level ?? null;
  const s = store.getSettings();
  return {
    water, waterGoal: s.waterGoal,
    waterPct: Math.min(Math.round((water / s.waterGoal) * 100), 100),
    mood, knee,
    day: PROGRAM.find(d => d.day === store.currentDay()) || PROGRAM[0]
  };
}
