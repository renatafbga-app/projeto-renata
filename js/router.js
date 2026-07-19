/* Router por hash — compatível com GitHub Pages e subpastas. */
import { qs, qsa } from './ui.js';
import { icon } from './icons.js';

const routes = [];
let current = null;
let navDepth = 0;

/* Ciclo de vida da tela.
   Cada render cria um AbortController; ao sair da tela ele é abortado e TODOS
   os listeners registrados com { signal } somem juntos. Sem isso, cada
   navegação deixava listeners de window/document para trás — vazamento real
   depois de dezenas de trocas de tela ao longo de um treino. */
let viewAbort = null;

export function route(pattern, loader) {
  const keys = [];
  const rx = new RegExp('^' + pattern
    .replace(/:[a-zA-Z]+/g, m => { keys.push(m.slice(1)); return '([^/]+)'; })
    .replace(/\//g, '\\/') + '$');
  routes.push({ rx, keys, loader, pattern });
}

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const path = raw.split('?')[0];
  for (const r of routes) {
    const m = path.match(r.rx);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
      return { ...r, params, path };
    }
  }
  return null;
}

export const go = path => { location.hash = path; };

/** Resolve um caminho para a rota correspondente. Exposto para testes. */
export function matchRoute(path) {
  for (const r of routes) {
    const m = path.match(r.rx);
    if (!m) continue;
    const params = {};
    r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
    return { pattern: r.pattern, params };
  }
  return null;
}
export function back() {
  if (navDepth > 0) history.back();
  else go('/');
}

/* Tab bar */
const TABS = [
  { path: '/',          icon: 'home',     label: 'Início'    },
  { path: '/treinos',   icon: 'dumbbell', label: 'Treinos'   },
  { path: '/livro',     icon: 'book',     label: 'Livro'     },
  { path: '/progresso', icon: 'chart',    label: 'Progresso' },
  { path: '/mais',      icon: 'more',     label: 'Mais'      }
];

export function renderTabs() {
  qs('#tabbar').innerHTML = TABS.map(t =>
    `<a class="tab" href="#${t.path}" data-tab="${t.path}">
       ${icon(t.icon, 25)}<span>${t.label}</span>
     </a>`).join('');
}

function syncTabs(path) {
  const root = '/' + (path.split('/')[1] || '');
  qsa('[data-tab]').forEach(a => {
    const tab = a.dataset.tab;
    const active = tab === '/' ? path === '/' : root === tab;
    a.classList.toggle('active', active);
  });
}

/* Navbar */
function setNavbar(view, params) {
  const compact = !!view.compact;
  qs('#app').classList.toggle('compact', compact);
  qs('#navLarge').hidden = compact;

  const title = typeof view.title === 'function' ? view.title(params) : (view.title || '');
  const sub   = typeof view.subtitle === 'function' ? view.subtitle(params) : (view.subtitle || '');

  qs('#navTitle').textContent = title;
  qs('#navSubtitle').textContent = sub;
  qs('#navCompactTitle').textContent = title;

  const backBtn = qs('#navBack');
  backBtn.hidden = !compact;
  qs('#navBackLabel').textContent = view.backLabel || 'Voltar';

  qs('#navActions').innerHTML = view.actions ? view.actions(params) : '';
  qs('#navbar').classList.toggle('scrolled', compact);
}

/* Render */
async function render() {
  const match = parse();
  const app = qs('#app');

  /* CORREÇÃO (v1.4.2): antes uma rota desconhecida redirecionava para a tela
     inicial em silêncio. O sintoma na mão da usuária era "toco no botão e volto
     para a Home", sem nenhuma pista do motivo — foi assim que uma versão com
     arquivos em cache desatualizados passou por toda uma homologação.
     Agora a falha é explícita e diagnosticável no próprio aparelho. */
  if (!match) {
    console.error('[router] rota não registrada:', match?.path ?? location.hash);
    app.classList.add('compact');
    qs('#navLarge').hidden = true;
    qs('#navBack').hidden = false;
    qs('#navCompactTitle').textContent = 'Tela não encontrada';
    app.innerHTML = `
      <div class="empty">
        <div class="empty-title">Não encontrei esta tela</div>
        <div class="empty-text">
          O endereço <code>${(location.hash || '#/').replace(/[<>&]/g, '')}</code>
          não corresponde a nenhuma tela deste aplicativo.
        </div>
        <div class="empty-text" style="margin-top:12px">
          Isso costuma acontecer quando o aparelho ainda tem uma versão antiga
          guardada. Em Configurações, use <strong>Forçar atualização</strong>.
        </div>
        <div class="hstack" style="justify-content:center;margin-top:20px">
          <a class="btn primary" href="#/">Ir para o início</a>
          <a class="btn" href="#/config">Abrir Configurações</a>
        </div>
      </div>`;
    return;
  }

  let view;
  try {
    view = await match.loader();
  } catch (err) {
    console.error('Falha ao carregar a tela:', err);
    app.innerHTML = `<div class="empty">
      <div class="empty-title">Não consegui abrir esta tela</div>
      <div class="empty-text">${err.message}</div></div>`;
    return;
  }

  const depth = match.path.split('/').length - 1;
  const goingBack = current && current.depth > depth;

  // encerra a tela anterior antes de montar a próxima
  viewAbort?.abort();
  viewAbort = new AbortController();
  const signal = viewAbort.signal;

  setNavbar(view, match.params);

  let html;
  try {
    html = await view.render(match.params);
  } catch (err) {
    console.error('[router] falha ao renderizar', match.path, err);
    app.innerHTML = `<div class="empty">
      <div class="empty-title">Não consegui montar esta tela</div>
      <div class="empty-text">${err.message}</div>
      <a class="btn primary" href="#/" style="margin-top:16px">Voltar ao início</a></div>`;
    return;
  }

  app.innerHTML = `<div class="view${goingBack ? ' back' : ''}">${html}</div>`;
  window.scrollTo(0, 0);
  syncTabs(match.path);

  try {
    view.mount?.(app, match.params, { signal });
  } catch (err) {
    console.error('[router] falha ao ativar a tela', match.path, err);
  }

  current = { path: match.path, depth };
  document.title = (view.title ? `${typeof view.title === 'function' ? view.title(match.params) : view.title} · ` : '') + 'Projeto Renata';
}

/**
 * Redesenha a tela atual sem reiniciar o aplicativo.
 * Antes as telas chamavam location.reload() depois de salvar ou apagar um
 * registro — o app inteiro reiniciava: splash, reabertura do IndexedDB e perda
 * da posição de rolagem. Um re-render custa milissegundos e não pisca.
 */
export function refresh() { return render(); }

export function startRouter() {
  window.addEventListener('hashchange', () => { navDepth++; render(); });
  qs('#navBack').addEventListener('click', back);
  render();
}
