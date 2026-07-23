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

const CACHE_VERSION = 'v1.6.2';
const CACHE = `projeto-renata-${CACHE_VERSION}`;

/** Tudo que o app precisa para abrir offline. */
const ASSETS = [
  './', './index.html', './manifest.json',
  './css/tokens.css', './css/base.css', './css/components.css', './css/views.css', './css/book.css',
  './js/app.js', './js/router.js', './js/ui.js', './js/icons.js',
  './js/core/schema.js', './js/core/db.js', './js/core/store.js',
  './js/core/autosave.js', './js/core/stats.js', './js/core/backup.js',
  './js/core/notifications.js', './js/core/adapters.js', './js/core/image.js',
  './js/core/foods.js', './js/core/dates.js',
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
/* Sem estes arquivos o aplicativo não funciona. Se algum falhar na instalação,
   abortamos: é melhor continuar na versão antiga, que funciona, do que ativar
   uma versão pela metade. */
const CRITICOS = [
  './index.html', './js/app.js', './js/router.js', './js/ui.js', './js/icons.js',
  './css/base.css', './css/components.css'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const falhas = [];
    await Promise.all(ASSETS.map(url =>
      cache.add(new Request(url, { cache: 'reload' }))
        .catch(err => { falhas.push(url); console.warn('[SW] não consegui cachear', url, err); })
    ));
    const criticasQueFalharam = falhas.filter(f => CRITICOS.includes(f));
    if (criticasQueFalharam.length) {
      // deixa o cache incompleto para trás e não assume o controle
      await caches.delete(CACHE);
      throw new Error('Instalação abortada: arquivos essenciais falharam — ' +
                      criticasQueFalharam.join(', '));
    }
    if (falhas.length) console.warn('[SW] instalado com', falhas.length, 'arquivo(s) opcional(is) faltando');
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
        const cache = await caches.open(CACHE);
        return (await cache.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  /* CORREÇÃO CRÍTICA (v1.4.2)
   * Antes usávamos `caches.match(req)` sem informar o cache. Esse método
   * procura em TODOS os caches da origem — inclusive em caches antigos que
   * por algum motivo tenham sobrevivido. O resultado era servir um arquivo
   * velho indefinidamente: o app.js da versão anterior voltava, sem as rotas
   * novas, e a navegação caía no fallback para a tela inicial.
   *
   * Agora consultamos APENAS o cache da versão atual.
   *
   * A estratégia passa a ser stale-while-revalidate: responde na hora com o
   * que está em cache (rápido e funciona offline) e, em paralelo, busca a
   * versão nova na rede e atualiza o cache. Na próxima abertura o arquivo já
   * é o atual — sem depender de duas reaberturas seguidas.
   */
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });

    const naRede = fetch(req).then(res => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (hit) { event.waitUntil(naRede); return hit; }

    const res = await naRede;
    return res || new Response('', { status: 504, statusText: 'Offline' });
  })());
});

/* ------------------------------------------------------------- mensagens */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'VERSION') event.source?.postMessage({ type: 'version', version: CACHE_VERSION });
  /* Limpa TODOS os caches do app a pedido da tela de Configurações.
     Não toca IndexedDB nem localStorage — os dados da usuária ficam intactos. */
  if (event.data === 'CLEAR_CACHES') {
    event.waitUntil((async () => {
      const chaves = await caches.keys();
      await Promise.all(chaves.filter(k => k.startsWith('projeto-renata-')).map(k => caches.delete(k)));
      event.source?.postMessage({ type: 'caches-cleared' });
    })());
  }
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
