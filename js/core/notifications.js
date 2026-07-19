/* ============================================================================
 * NOTIFICAÇÕES E LEMBRETES
 *
 * LIMITAÇÃO REAL DO iOS (documentada, não é bug):
 *   Um PWA sem servidor de push NÃO consegue disparar notificação com o app
 *   fechado. O iOS só entrega Web Push (iOS 16.4+) para apps instalados na tela
 *   inicial e a partir de um servidor. Sem backend, não há agendamento real.
 *
 * ESTRATÉGIA ADOTADA (a melhor possível sem servidor):
 *   1. Notificação nativa quando o app está ABERTO e o horário chega.
 *   2. Lembretes internos: ao abrir o app, mostramos o que ficou pendente hoje.
 *   3. Cada lembrete é marcado como entregue por dia, para não repetir.
 *   4. Ao concluir o treino, os lembretes de treino do dia são cancelados.
 *   5. `subscribePush()` já está pronto para quando existir um backend.
 * ========================================================================== */
import * as store from './store.js';
import { LS_PREFIX } from './schema.js';

const K_FIRED = () => `${LS_PREFIX}reminders.fired.${store.activeProfile()}`;
let ticker = null;

const firedToday = () => {
  const vazio = { date: store.todayISO(), keys: [] };
  try {
    const o = JSON.parse(localStorage.getItem(K_FIRED()) || 'null');
    if (!o || typeof o !== 'object' || !Array.isArray(o.keys)) return vazio;
    return o.date === store.todayISO() ? o : vazio;
  } catch (err) {
    console.warn('[lembretes] registro corrompido, reiniciando o dia', err);
    return vazio;
  }
};
const markFired = key => {
  const o = firedToday();
  if (!o.keys.includes(key)) o.keys.push(key);
  store.safeSet(K_FIRED(), JSON.stringify(o));
};
export const wasFired = key => firedToday().keys.includes(key);

export const permission = () =>
  ('Notification' in window) ? Notification.permission : 'unsupported';

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try { return await Notification.requestPermission(); } catch { return 'denied'; }
}

/** Envia notificação nativa se possível; devolve false para o app exibir alerta interno. */
export function notify(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, tag, icon: './icons/icon-192.png', badge: './icons/icon-192.png' });
    return true;
  } catch { return false; }
}

const hhmmToMin = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

/** Quantos dias se passaram entre duas datas ISO. */
const diasEntre = (a, b) =>
  Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);

/**
 * Lembretes previstos para hoje, com estado de pendência.
 * Cada categoria tem sua própria regra de recorrência:
 *   horarios  → uma ou várias horas fixas no dia
 *   semanal   → dia da semana + hora
 *   intervalo → a cada N dias desde o último registro
 */
export async function dueReminders() {
  const s = store.getSettings();
  const r = s.reminders || {};
  if (!r.enabled) return [];

  const agora = nowMin();
  const hoje = store.todayISO();
  const out = [];

  const push = (key, time, title, body) => {
    if (hhmmToMin(time) > agora) return;   // ainda não chegou a hora
    if (wasFired(key)) return;             // já avisamos hoje
    out.push({ key, time, title, body });
  };

  /* --- água: vários horários ao longo do dia --- */
  if (r.water?.on) {
    const ml = (await store.getDaily('water', hoje))?.value?.ml || 0;
    if (ml < s.waterGoal) {
      for (const time of r.water.times || []) {
        push(`water:${time}`, time, 'Hora de beber água',
          `Você está em ${ml} ml de ${s.waterGoal} ml hoje.`);
      }
    }
  }

  /* --- treino --- */
  if (r.workout?.on && !store.isDayComplete(store.currentDay())) {
    for (const time of r.workout.times || []) {
      push(`workout:${time}`, time, 'Hora do treino',
        `O dia ${store.currentDay()} do seu programa está esperando.`);
    }
  }

  /* --- refeições não registradas --- */
  if (r.meals?.on) {
    const refeicoes = (await store.getDaily('meals', hoje))?.value || {};
    const chaves = ['breakfast', 'lunch', 'dinner'];
    (r.meals.times || []).forEach((time, i) => {
      const chave = chaves[i];
      const temItens = (refeicoes[chave]?.itens || []).length > 0;
      if (!temItens) {
        push(`meal:${chave}`, time, 'Registrar refeição',
          'Anote o que você comeu para acompanhar as proteínas do dia.');
      }
    });
  }

  /* --- peso: um dia da semana --- */
  if (r.weight?.on && new Date().getDay() === Number(r.weight.weekday ?? 0)) {
    if (!(await store.getDaily('weight', hoje))) {
      push('weight', r.weight.time || '08:00', 'Pesagem da semana',
        'Registre seu peso — sempre no mesmo dia e horário.');
    }
  }

  /* --- medidas e fotos: a cada N dias --- */
  for (const [kind, categoria, titulo, texto] of [
    ['measures', r.measures, 'Hora de medir', 'Faça as medidas corporais e acompanhe a evolução.'],
    ['photos',   r.photos,   'Foto de progresso', 'Registre suas fotos e compare com o Dia 0.']
  ]) {
    if (!categoria?.on) continue;
    const registros = kind === 'photos'
      ? await store.listPhotoSessions()
      : await store.listDaily(kind);
    const ultima = registros.at(-1)?.date;
    const passou = !ultima || diasEntre(ultima, hoje) >= Number(categoria.everyDays || 30);
    if (passou) push(kind, categoria.time || '09:00', titulo, texto);
  }

  return out;
}

/** Dispara os lembretes vencidos. onInternal recebe os que não viraram notificação. */
export async function runDue(onInternal) {
  let due = [];
  try {
    due = await dueReminders();
  } catch (err) {
    console.warn('[lembretes] não consegui calcular os pendentes', err);
    return [];
  }
  const internos = [];
  for (const r of due) {
    const enviou = notify(r.title, r.body, r.key);
    markFired(r.key);
    if (!enviou) internos.push(r);
  }
  if (internos.length) onInternal?.(internos);
  return due;
}

/** Cancela os lembretes de treino do dia (chamado ao finalizar o treino). */
export function cancelWorkoutReminders() {
  const times = store.getSettings().reminders?.workout?.times || [];
  times.forEach(t => markFired(`workout:${t}`));
  markFired('workout');
}

/** Verifica a cada minuto enquanto o app estiver aberto. */
export function startTicker(onInternal) {
  stopTicker();
  runDue(onInternal);
  ticker = setInterval(() => runDue(onInternal), 60_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') runDue(onInternal);
  });
}
export function stopTicker() { clearInterval(ticker); ticker = null; }

/* ------------------------------------------------------------------ futuro */
/** Pronto para quando houver backend com VAPID. Hoje devolve null. */
export async function subscribePush(vapidPublicKey) {
  if (!vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidPublicKey });
}
