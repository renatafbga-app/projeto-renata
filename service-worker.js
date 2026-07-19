/* ============================================================================
 * SERVICE WORKER — offline completo.
 *
 * ⚠️ GARANTIA DE PRESERVAÇÃO DE DADOS (requisito 4 da Etapa 3)
 *   Este arquivo mexe EXCLUSIVAMENTE na Cache Storage, que guarda apenas os
 *   arquivos estáticos do aplicativo (HTML, CSS, JS, ícones, conteúdo do livro).
 *   Ele NUNCA acessa IndexedDB nem localStorage — que é onde moram os dados da
 *   usuária. Portanto, publicar uma nova versão:
 *     • troca os arquivos do app e apaga caches antigos;
 *     • NÃO apaga treinos, cargas, peso, medidas, diário ou configurações.
 *   Para subir uma versão nova, basta alterar CACHE_VERSION abaixo.
 * ========================================================================== */

const CACHE_VERSION = 'v1.4.1';
const CACHE = `projeto-renata-${CACHE_VERSION}`;

/** Tudo que o app precisa para abrir offline. */
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/tokens.css', './css/base.css', './css/components.css', './css/views.css', './css/book.css',
  './js/app.js', './js/router.js', './js/ui.js', './js/icons.js',
  './js/core/schema.js', './js/core/db.js', './js/core/store.js',
  './js/core/autosave.js', './js/core/stats.js', './js/core/backup.js',
  './js/core/notifications.js', './js/core/adapters.js', './js/core/image.js',
  './js/views/home.js', './js/views/book.js', './js/views/book-chapter.js',
  './js/views/workouts.js', './js/views/workout-day.js', './js/views/session.js',
  './js/views/library.js', './js/views/exercise.js', './js/views/progress.js',
  './js/views/more.js', './js/views/weight.js', './js/views/measures.js',
  './js/views/water.js', './js/views/nutrition.js', './js/views/sleep.js',
  './js/views/mood.js', './js/views/knee.js', './js/views/journal.js',
  './js/views/settings.js', './js/views/photos.js', './js/views/reminders.js',
  './js/views/stretch.js', './js/views/stretches.js',
  './data/figures.data.js', './data/exercises.data.js',
  './data/program.data.js', './data/book.data.js', './data/stretches.data.js',
  './data/foods.data.js',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

/* ---------------------------------------------------------------- install */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll falha inteiro se um arquivo faltar; adicionamos um a um para
    // que o app continue instalável mesmo se algum recurso opcional sumir.
    await Promise.all(ASSETS.map(url =>
      cache.add(new Request(url, { cache: 'reload' })).catch(err =>
        console.warn('[SW] não consegui cachear', url, err))
    ));
    await self.skipWaiting();
  })());
});

/* --------------------------------------------------------------- activate */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Remove SOMENTE caches antigos deste app. Nada de dados do usuário aqui.
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith('projeto-renata-') && k !== CACHE)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* ------------------------------------------------------------------ fetch
 * Estratégia:
 *   • Navegação  → rede primeiro, cache como reserva (pega versão nova quando
 *                  há internet, e continua abrindo offline).
 *   • Estáticos  → cache primeiro (o conteúdo do livro não muda).
 * -------------------------------------------------------------------------- */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // nada de terceiros

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

/* ------------------------------------------------------------- mensagens */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION') event.source?.postMessage({ version: CACHE_VERSION });
});

/* --------------------------------------------------------- push (futuro) */
self.addEventListener('push', event => {
  if (!event.data) return;
  let d = {};
  try { d = event.data.json(); } catch { d = { title: 'Projeto Renata', body: event.data.text() }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Projeto Renata', {
    body: d.body || '', icon: './icons/icon-192.png', badge: './icons/icon-192.png', tag: d.tag
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow('./index.html');
  }));
});
