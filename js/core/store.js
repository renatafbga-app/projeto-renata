/* ============================================================================
 * STORE — porta ÚNICA de acesso aos dados do usuário.
 *
 * Regra de ouro do projeto: nenhuma view usa localStorage ou IndexedDB
 * diretamente. Assim, backup, importação, troca de perfil e futura sincronização
 * em nuvem enxergam 100% dos dados, sem exceções esquecidas.
 *
 * Emite eventos de mudança para que as telas se atualizem sozinhas.
 * ========================================================================== */
import * as db from './db.js';
import { LS_PREFIX, DEFAULT_SETTINGS, DAILY_KINDS, PHOTO_SLOTS } from './schema.js';
import { hojeISO, dataAtiva } from './dates.js';

/* -------------------------------------------------- perfis (multi-perfil) */
const K_PROFILES = LS_PREFIX + 'profiles';
const K_ACTIVE   = LS_PREFIX + 'activeProfile';

export function listProfiles() {
  const list = readJSON(K_PROFILES, null);
  return Array.isArray(list) && list.length ? list : [{ id: 'default', name: 'Renata' }];
}
export function activeProfile() {
  return safeGet(K_ACTIVE) || 'default';
}
export function setActiveProfile(id) {
  safeSet(K_ACTIVE, id);
  emit('profile', id);
}
export function createProfile(name) {
  const id = 'p' + Date.now().toString(36);
  const list = listProfiles();
  list.push({ id, name });
  safeSet(K_PROFILES, JSON.stringify(list));
  emit('profile', id);
  return id;
}
const P = () => activeProfile();

/* -------------------------------------------------- barramento de eventos */
const bus = new EventTarget();
export const on  = (type, fn) => bus.addEventListener(type, fn);
export const off = (type, fn) => bus.removeEventListener(type, fn);
const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }));

/* -------------------------------------------------- utilidades */
/* Data local — nunca UTC. Ver js/core/dates.js para a correção do bug da
   virada do dia às 21h. Mantido o nome todayISO por compatibilidade. */
export const todayISO = hojeISO;

/* Data em que os módulos de registro diário operam. É a data ativa do seletor
   global (js/core/dates.js). Quando o usuário navega para outro dia, todas as
   telas passam a ler e gravar nessa data — nunca mais "sempre hoje". */
export const dataDeTrabalho = dataAtiva;
/**
 * Escrita protegida no localStorage.
 * Safari em Navegação Privada e cotas cheias fazem setItem LANÇAR. Sem esta
 * proteção, uma exceção aqui derrubava o autosave e a tela inteira.
 */
export function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (err) { console.warn('[store] não consegui gravar', key, err); return false; }
}
function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
/** Lê e valida JSON; devolve o padrão se o conteúdo estiver corrompido. */
function readJSON(key, fallback) {
  const raw = safeGet(key);
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return (v && typeof v === 'object') ? v : fallback;
  } catch (err) {
    console.warn('[store] dado corrompido em', key, '— usando o padrão', err);
    return fallback;
  }
}

const now = () => new Date().toISOString();

/* ==========================================================================
 * CONFIGURAÇÕES — localStorage (leitura síncrona, volume mínimo)
 * Merge com DEFAULT_SETTINGS: chaves novas de versões futuras aparecem
 * automaticamente sem sobrescrever o que o usuário já escolheu.
 * ========================================================================== */
const K_SETTINGS = () => `${LS_PREFIX}settings.${P()}`;

export function getSettings() {
  const saved = readJSON(K_SETTINGS(), {});
  return {
    ...DEFAULT_SETTINGS, ...saved,
    mealTimes: { ...DEFAULT_SETTINGS.mealTimes, ...(saved.mealTimes || {}) },
    // merge por categoria: uma categoria nova numa versão futura aparece
    // sozinha, sem apagar os horários que a usuária já configurou
    reminders: (() => {
      const base = DEFAULT_SETTINGS.reminders, sv = saved.reminders || {};
      const out = { enabled: sv.enabled ?? base.enabled };
      for (const [k, v] of Object.entries(base)) {
        if (k === 'enabled') continue;
        out[k] = (sv[k] && typeof sv[k] === 'object') ? { ...v, ...sv[k] } : v;
      }
      return out;
    })(),
    units:     { ...DEFAULT_SETTINGS.units,     ...(saved.units || {}) }
  };
}
export function setSettings(patch) {
  const next = { ...getSettings(), ...patch };
  safeSet(K_SETTINGS(), JSON.stringify(next));
  emit('settings', next);
  return next;
}

/* ==========================================================================
 * PROGRESSO DO PROGRAMA
 * ========================================================================== */
const K_PROGRESS = () => `${LS_PREFIX}progress.${P()}`;
const DEFAULT_PROGRESS = { completedDays: [], lastCompletedDate: null };

export function getProgress() {
  const p = readJSON(K_PROGRESS(), {});
  const merged = { ...DEFAULT_PROGRESS, ...p };
  // defesa contra arquivo de backup adulterado ou dado corrompido
  const days = Array.isArray(merged.completedDays) ? merged.completedDays : [];
  merged.completedDays = [...new Set(days)]
    .filter(d => Number.isInteger(d) && d >= 1 && d <= 90)
    .sort((a, b) => a - b);
  return merged;
}
function saveProgress(p) {
  safeSet(K_PROGRESS(), JSON.stringify(p));
  emit('progress', p);
  return p;
}
export function markDayComplete(day) {
  const p = getProgress();
  if (!p.completedDays.includes(day)) p.completedDays.push(day);
  p.completedDays.sort((a, b) => a - b);
  p.lastCompletedDate = todayISO();
  return saveProgress(p);
}
export function unmarkDay(day) {
  const p = getProgress();
  p.completedDays = p.completedDays.filter(d => d !== day);
  return saveProgress(p);
}
/** Próximo dia a fazer = menor dia ainda não concluído (1..90). */
export function currentDay() {
  const done = new Set(getProgress().completedDays);
  for (let d = 1; d <= 90; d++) if (!done.has(d)) return d;
  return 90;
}
export const isDayComplete = day => getProgress().completedDays.includes(day);
/** Bloqueio sequencial, salvo se o Modo Livre estiver ligado. */
export function isDayLocked(day) {
  if (getSettings().freeMode) return false;
  return day > currentDay();
}

/* ==========================================================================
 * TREINOS — um registro por dia executado
 * ========================================================================== */
const wid = day => `${P()}:${day}`;

export async function getWorkout(day) {
  return (await db.get('workouts', wid(day))) || null;
}
/** Salvamento incremental (autosave). Cria o registro se ainda não existir. */
export async function saveWorkout(day, patch) {
  const prev = (await getWorkout(day)) || {
    id: wid(day), profile: P(), day, status: 'in_progress',
    startedAt: now(), exercises: [], checkin: {}
  };
  const next = { ...prev, ...patch, updatedAt: now() };
  await db.put('workouts', next);
  emit('workout', next);
  return next;
}
/** Finaliza: marca o dia, grava as séries no log e devolve o registro. */
export async function finishWorkout(day, { durationSec = 0, kcal = 0, checkin = {} } = {}) {
  const w = await saveWorkout(day, {
    status: 'done', finishedAt: now(), durationSec, kcal, checkin
  });
  await syncSetsLog(w);
  markDayComplete(day);
  emit('finish', w);
  return w;
}
export const listWorkouts = () =>
  db.byIndex('workouts', 'profile', IDBKeyRange.only(P()));

/* ==========================================================================
 * LOG DE SÉRIES — histórico de carga por exercício
 * Reescrito a cada finalização para manter consistência com o treino.
 * ========================================================================== */
async function syncSetsLog(workout) {
  /* BUG CORRIGIDO (auditoria 4.5): antes limpávamos as séries antigas filtrando
     pela DATA de conclusão. Ao refazer um treino em outro dia, as séries do
     registro anterior sobreviviam e o histórico de carga contava duas vezes —
     inflando "maior carga" e distorcendo a sugestão. Agora limpamos por DIA do
     programa, que é a identidade real do treino. */
  const all = await db.all('sets');
  for (const r of all.filter(r => r.profile === P() && r.day === workout.day)) {
    await db.del('sets', r.id);
  }

  const date = (workout.finishedAt || now()).slice(0, 10);
  const rows = [];
  for (const ex of workout.exercises || []) {
    (ex.sets || []).forEach((s, i) => {
      const weight = Number(s.weight), reps = Number(s.reps);
      if (!s.done || !(weight > 0) || !(reps > 0)) return;
      rows.push({ profile: P(), exKey: ex.key, day: workout.day, date, index: i, weight, reps });
    });
  }
  if (rows.length) await db.putMany('sets', rows);
}

export const setsForExercise = exKey =>
  db.byIndex('sets', 'profile_ex', IDBKeyRange.only([P(), exKey]));

/**
 * Estatísticas de carga + sugestão para hoje.
 *
 * REGRA DE SEGURANÇA (vinda do livro): a sugestão NUNCA sobe se o último
 * check-in registrou dor no joelho >= 4. Progressão só com articulação calma.
 */
export async function loadStats(exKey) {
  const rows = (await setsForExercise(exKey)).sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return { count: 0, last: null, max: null, avg: null, suggestion: null, history: [] };

  const byDate = new Map();
  rows.forEach(r => {
    const cur = byDate.get(r.date) || { date: r.date, max: 0, vol: 0 };
    cur.max = Math.max(cur.max, r.weight);
    cur.vol += r.weight * r.reps;
    byDate.set(r.date, cur);
  });
  const history = [...byDate.values()].map(d => ({ date: d.date, v: d.max }));
  const last = history.at(-1).v;
  const max  = Math.max(...history.map(h => h.v));
  const avg  = +(history.slice(-3).reduce((s, h) => s + h.v, 0) / Math.min(history.length, 3)).toFixed(1);

  const lastDay = rows.at(-1).day;
  const w = await getWorkout(lastDay);
  const pain = Number(w?.checkin?.pain ?? 0);
  const allDone = (w?.exercises || []).find(e => e.key === exKey)?.sets?.every(s => s.done);

  let suggestion = last, reason = 'Repita a carga e capriche na técnica.';
  if (pain >= 4) {
    reason = 'Mantida: o último check-in registrou dor no joelho. Progressão só com a articulação calma.';
  } else if (allDone) {
    suggestion = +(last + (last >= 10 ? 2 : 1)).toFixed(1);
    reason = 'Você fechou todas as séries sem dor — dá para subir um pouco.';
  }
  return { count: rows.length, last, max, avg, suggestion, reason, history };
}

/* ==========================================================================
 * REGISTROS DIÁRIOS — weight | measures | water | meals | sleep | mood | knee
 * ========================================================================== */
const did = (kind, date) => `${P()}:${kind}:${date}`;

export async function getDaily(kind, date = todayISO()) {
  return (await db.get('daily', did(kind, date))) || null;
}
export async function setDaily(kind, date, value, note = '') {
  if (!DAILY_KINDS.includes(kind)) throw new Error(`kind inválido: ${kind}`);
  const rec = { id: did(kind, date), profile: P(), kind, date, value, note, updatedAt: now() };
  await db.put('daily', rec);
  emit('daily', rec);
  emit('daily:' + kind, rec);
  return rec;
}
export async function patchDaily(kind, date, patch) {
  const prev = await getDaily(kind, date);
  const value = (prev?.value && typeof prev.value === 'object')
    ? { ...prev.value, ...patch } : patch;
  return setDaily(kind, date, value, prev?.note || '');
}
export async function listDaily(kind) {
  const rows = await db.byIndex('daily', 'profile_kind', IDBKeyRange.only([P(), kind]));
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
export const removeDaily = (kind, date) => db.del('daily', did(kind, date)).then(() => emit('daily'));

/** Série numérica pronta para gráfico. */
export async function series(kind, pick = v => v) {
  return (await listDaily(kind))
    .map(r => ({ date: r.date, v: Number(pick(r.value)) }))
    .filter(p => Number.isFinite(p.v));
}

/* ==========================================================================
 * EVOLUÇÃO POR FOTOS
 * Tudo fica no aparelho. Nenhuma imagem sai daqui: sem servidor, sem nuvem,
 * sem compartilhamento automático. Entram no backup porque o store `photos`
 * faz parte do schema — o backup itera sobre ele como sobre qualquer outro.
 * ========================================================================== */
const pid = date => `${P()}:${date}`;

export async function getPhotoSession(date) {
  return (await db.get('photos', pid(date))) || null;
}

/**
 * Cria ou atualiza o registro de uma data.
 *
 * FONTE ÚNICA DE VERDADE PARA O PESO (correção v1.5.0)
 * Antes o peso era gravado dentro do próprio registro fotográfico, separado do
 * registro diário usado por Peso e Medidas. Resultado: a mesma data podia ter
 * dois pesos diferentes, e o card "Último peso" das Fotos aparecia vazio mesmo
 * com peso lançado no módulo Peso.
 *
 * Agora o peso mora SEMPRE em `daily/weight`. As Fotos leem e escrevem lá —
 * não guardam cópia. Qualquer módulo que registre peso alimenta todos os outros.
 */
export async function savePhotoSession(date, patch = {}) {
  const { weight, ...resto } = patch;

  // peso vai para o registro diário, nunca para dentro da foto
  if (weight !== undefined) {
    if (Number.isFinite(weight) && weight > 0) {
      const anterior = await getDaily('weight', date);
      await setDaily('weight', date, { kg: weight }, anterior?.note || '');
    }
  }

  const prev = (await getPhotoSession(date)) || {
    id: pid(date), profile: P(), date, note: '', shots: {}, createdAt: now()
  };
  const rec = { ...prev, ...resto, updatedAt: now() };
  delete rec.weight;                      // limpa cópias de versões anteriores
  await db.put('photos', rec);
  emit('photos', rec);
  return rec;
}

/** Peso registrado para uma data, venha de onde vier. */
export async function pesoDoDia(date) {
  const rec = await getDaily('weight', date);
  const kg = Number(rec?.value?.kg);
  return Number.isFinite(kg) && kg > 0 ? kg : null;
}

/** Grava uma foto num ângulo. `dataURL` já vem comprimido pela view. */
export async function setPhotoShot(date, slot, dataURL) {
  if (!PHOTO_SLOTS.some(s => s.key === slot)) throw new Error(`ângulo inválido: ${slot}`);
  const rec = await savePhotoSession(date);
  rec.shots = { ...rec.shots, [slot]: dataURL };
  rec.updatedAt = now();
  await db.put('photos', rec);
  emit('photos', rec);
  return rec;
}

export async function removePhotoShot(date, slot) {
  const rec = await getPhotoSession(date);
  if (!rec) return null;
  const shots = { ...rec.shots };
  delete shots[slot];
  const next = { ...rec, shots, updatedAt: now() };
  await db.put('photos', next);
  emit('photos', next);
  return next;
}

export const removePhotoSession = date =>
  db.del('photos', pid(date)).then(() => emit('photos'));

/**
 * Sessões em ordem cronológica, já com o peso do dia vindo de `daily/weight`.
 * O peso é anexado na leitura (join), nunca duplicado no armazenamento.
 */
export async function listPhotoSessions() {
  const rows = await db.byIndex('photos', 'profile', IDBKeyRange.only(P()));
  const pesos = new Map(
    (await listDaily('weight')).map(r => [r.date, Number(r.value?.kg)])
  );
  return rows
    .map(r => {
      const kg = pesos.get(r.date);
      return {
        ...r,
        total: Object.keys(r.shots || {}).length,
        weight: Number.isFinite(kg) && kg > 0 ? kg : null
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Última avaliação corporal: a data mais recente entre peso, medidas e fotos.
 * Alimenta o lembrete de 15 dias na Home. Não limita registros — apenas informa
 * há quanto tempo foi a última avaliação.
 */
export async function ultimaAvaliacao() {
  const datas = [];
  const pesos = await listDaily('weight');
  if (pesos.length) datas.push(pesos.at(-1).date);
  const medidas = await listDaily('measures');
  if (medidas.length) datas.push(medidas.at(-1).date);
  const fotos = await listPhotoSessions();
  const comFoto = fotos.filter(f => f.total > 0);
  if (comFoto.length) datas.push(comFoto.at(-1).date);
  if (!datas.length) return null;
  datas.sort();
  const ultima = datas.at(-1);
  const hoje = hojeISO();
  const dias = Math.round((new Date(hoje + 'T12:00:00') - new Date(ultima + 'T12:00:00')) / 86400000);
  return { date: ultima, dias, pendencias: {
    peso: !pesos.some(p => p.date === ultima),
    medidas: !medidas.some(m => m.date === ultima),
    fotos: !comFoto.some(f => f.date === ultima)
  } };
}

/** Último peso conhecido no aplicativo inteiro, com a data em que foi medido. */
export async function ultimoPeso() {
  const linhas = (await listDaily('weight'))
    .filter(r => Number(r.value?.kg) > 0);
  if (!linhas.length) return null;
  const ultima = linhas.at(-1);
  return { kg: Number(ultima.value.kg), date: ultima.date };
}

/* ==========================================================================
 * DIÁRIO
 * ========================================================================== */
export async function addJournal(text, date = todayISO()) {
  const rec = { profile: P(), date, text, createdAt: now(), updatedAt: now() };
  const id = await db.put('journal', rec);
  emit('journal');
  return { ...rec, id };
}
export async function updateJournal(id, text) {
  const rec = await db.get('journal', id);
  if (!rec) return null;
  rec.text = text; rec.updatedAt = now();
  await db.put('journal', rec);
  emit('journal');
  return rec;
}
export const removeJournal = id => db.del('journal', id).then(() => emit('journal'));
export const listJournal = async () =>
  (await db.byIndex('journal', 'profile', IDBKeyRange.only(P())))
    .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));

/* ==========================================================================
 * INICIALIZAÇÃO
 * ========================================================================== */
export async function init() {
  await db.open();
  await db.runMigrations();
  await db.put('meta', { key: 'lastOpen', value: now() });
  if (!localStorage.getItem(K_PROFILES))
    localStorage.setItem(K_PROFILES, JSON.stringify(listProfiles()));
  return true;
}

export { db };
