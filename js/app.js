/* ============================================================================
 * BOOTSTRAP — inicializa dados, rotas, tema, lembretes e Service Worker.
 * Ordem importa: o store abre ANTES do router, para nenhuma tela renderizar
 * com dados vazios.
 * ========================================================================== */
import { route, startRouter, renderTabs } from './router.js';
import { qs, toast } from './ui.js';
import * as store from './core/store.js';
import * as notif from './core/notifications.js';

export const APP_VERSION = '1.0.0';

/* ---------------------------------------------------------------- tema */
export function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  qs('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#000000' : '#F2F2F7');
  store.setSettings({ theme: t });
}

/* -------------------------------------------------------------- rotas */
const V = p => () => import(`./views/${p}.js`).then(m => m.default);
route('/',               V('home'));
route('/livro',          V('book'));
route('/livro/:id',      V('book-chapter'));
route('/treinos',        V('workouts'));
route('/treinos/dia/:n', V('workout-day'));
route('/sessao/:n',      V('session'));
route('/biblioteca',     V('library'));
route('/biblioteca/:id', V('exercise'));
route('/alongamentos',   V('stretches'));
route('/alongamentos/:id', V('stretch'));
route('/progresso',      V('progress'));
route('/mais',           V('more'));
route('/peso',           V('weight'));
route('/medidas',        V('measures'));
route('/agua',           V('water'));
route('/alimentacao',    V('nutrition'));
route('/sono',           V('sleep'));
route('/humor',          V('mood'));
route('/joelho',         V('knee'));
route('/diario',         V('journal'));
route('/fotos',          V('photos'));
route('/lembretes',      V('reminders'));
route('/config',         V('settings'));

/* ------------------------------------------------- navbar reage ao scroll */
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const compact = qs('#app').classList.contains('compact');
    qs('#navbar').classList.toggle('scrolled', compact || window.scrollY > 18);
    ticking = false;
  });
}, { passive: true });

/* --------------------------------------------------------- lembrete interno */
function showInternalReminders(list) {
  const first = list[0];
  if (!first) return;
  toast(`${first.title}: ${first.body}`);
}

/* ------------------------------------------------------------ inicialização */
(async function boot() {
  try {
    await store.init();
    applyTheme(store.getSettings().theme || 'dark');
  } catch (err) {
    console.error('Falha ao abrir o banco de dados:', err);
    toast('Não consegui abrir o armazenamento local');
  }

  renderTabs();
  startRouter();

  // sinaliza ao vigia de inicialização do index.html que o app subiu
  window.__PR_BOOTED = true;
  setTimeout(() => qs('#splash')?.classList.add('hide'), 380);

  // Lembretes só depois da tela pronta, para não atrapalhar a abertura.
  setTimeout(() => notif.startTicker(showInternalReminders), 2500);
})();

/* ----------------------------------------------------------- Service Worker
 * IMPORTANTE: atualizar o app troca apenas arquivos estáticos e limpa caches.
 * IndexedDB e localStorage NUNCA são tocados — os dados do usuário sobrevivem.
 * -------------------------------------------------------------------------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js');
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            toast('Nova versão disponível — reabra o app');
          }
        });
      });
    } catch (e) { /* offline ou sem suporte: segue funcionando */ }
  });
}
