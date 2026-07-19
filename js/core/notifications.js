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

/** Lembretes previstos para hoje, com estado de pendência. */
export async function dueReminders() {
  const s = store.getSettings();
  if (!s.reminders.enabled) return [];
  const t = nowMin(), date = store.todayISO(), out = [];

  const push = (key, time, title, body) => {
    if (hhmmToMin(time) > t) return;          // ainda não chegou a hora
    if (wasFired(key)) return;                // já avisamos hoje
    out.push({ key, time, title, body });
  };

  if (s.reminders.workout && !store.isDayComplete(store.currentDay()))
    push('workout', s.workoutTime, 'Hora do treino',
         `Dia ${store.currentDay()} do seu programa está esperando.`);

  if (s.reminders.water) {
    const ml = (await store.getDaily('water', date))?.value?.ml || 0;
    if (ml < s.waterGoal)
      push('water', '15:00', 'Água', `Você está em ${ml} ml de ${s.waterGoal} ml hoje.`);
  }
  if (s.reminders.weight) {
    const has = await store.getDaily('weight', date);
    if (!has) push('weight', '08:00', 'Pesagem', 'Que tal registrar seu peso de hoje?');
  }
  if (s.reminders.sleep) {
    const has = await store.getDaily('sleep', date);
    if (!has) push('sleep', '09:00', 'Sono', 'Registre como você dormiu esta noite.');
  }
  if (s.reminders.meals) {
    for (const [k, time] of Object.entries(s.mealTimes)) {
      const meals = (await store.getDaily('meals', date))?.value || {};
      if (!meals[k]) push('meal:' + k, time, 'Refeição', 'Não esqueça de registrar o que você comeu.');
    }
  }
  return out;
}

/** Dispara os lembretes vencidos. onInternal recebe os que não viraram notificação. */
export async function runDue(onInternal) {
  const due = await dueReminders();
  const internal = [];
  for (const r of due) {
    const sent = notify(r.title, r.body, r.key);
    markFired(r.key);
    if (!sent) internal.push(r);
  }
  if (internal.length) onInternal?.(internal);
  return due;
}

/** Cancela os lembretes do dia ligados ao treino (chamado ao finalizar). */
export function cancelWorkoutReminders() { markFired('workout'); }

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
