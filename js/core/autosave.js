/* ============================================================================
 * AUTOSAVE — salvamento automático, sem botão "Salvar".
 *
 * DECISÃO DE UX (padrão nativo iOS): apps do iPhone não pedem confirmação para
 * guardar o que você digitou. Aqui vale o mesmo: qualquer campo com [data-save]
 * é persistido sozinho, com debounce, e um selo discreto "Salvo" confirma.
 *
 * Uso na view:
 *   <input class="input" data-save="water" data-field="ml">
 *   bindAutosave(root, { onSave: (field, value, el) => store.patchDaily(...) })
 * ========================================================================== */
import { qsa } from '../ui.js';

const DEBOUNCE_MS = 450;

/** Selo "Salvo" — reaproveitado, some sozinho. */
let badge, badgeTimer;
export function flashSaved(text = 'Salvo') {
  if (!badge) {
    badge = document.createElement('div');
    badge.className = 'save-badge';
    document.body.appendChild(badge);
  }
  badge.textContent = text;
  badge.classList.add('show');
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => badge.classList.remove('show'), 1200);
}

/**
 * Liga o autosave nos campos de um container.
 * @param {HTMLElement} root
 * @param {(field:string, value:any, el:HTMLElement)=>Promise|void} onSave
 */
export function bindAutosave(root, onSave, { signal } = {}) {
  const timers = new Map();

  const commit = (el, immediate = false) => {
    const field = el.dataset.save;
    if (!field) return;
    const value = el.type === 'checkbox' ? el.checked : el.value;
    clearTimeout(timers.get(el));
    const run = async () => {
      try { await onSave(field, value, el); flashSaved(); }
      catch (err) { console.error('[autosave]', field, err); flashSaved('Erro ao salvar'); }
    };
    if (immediate) run(); else timers.set(el, setTimeout(run, DEBOUNCE_MS));
  };

  qsa('[data-save]', root).forEach(el => {
    const evt = ['date', 'time', 'checkbox', 'radio'].includes(el.type) ? 'change' : 'input';
    el.addEventListener(evt, () => commit(el, evt === 'change'), { signal });
    el.addEventListener('blur', () => commit(el, true), { signal });
  });

  /* Grava ao minimizar o app ou fechar a aba.
     Os listeners vivem enquanto a tela existir: o AbortController do router os
     remove na próxima navegação. Antes usávamos { once: true }, que só limpava
     depois de disparar — e acumulava um par de listeners por tela visitada. */
  const flushAll = () => qsa('[data-save]', root).forEach(el => commit(el, true));
  window.addEventListener('pagehide', flushAll, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushAll();
  }, { signal });

  // grava o que estiver pendente quando a tela for descartada
  signal?.addEventListener('abort', flushAll, { once: true });

  return { flushAll };
}
