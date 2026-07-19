import { icon } from '../icons.js';
import { refresh } from '../router.js';
import { qs, qsa, toast, fmtDate, esc, haptic } from '../ui.js';
import * as store from '../core/store.js';
import { flashSaved } from '../core/autosave.js';

export default {
  title: 'Diário', subtitle: 'Suas anotações da jornada',
  async render() {
    const rows = await store.listJournal();
    return `
      <div class="card">
        <textarea class="textarea" id="jText" style="min-height:120px"
          placeholder="Como foi hoje? Vitórias, dificuldades, como o joelho respondeu…"></textarea>
        <button class="btn primary block mt-2" id="jSave">${icon('plus', 19)} Salvar entrada</button>
      </div>
      <div class="section-header"><span class="section-title">Entradas</span></div>
      ${rows.length ? rows.map(j => `
        <article class="journal-entry" data-id="${j.id}">
          <div class="spread">
            <div class="journal-date">${fmtDate(j.date, 'long')}</div>
            <button class="row-chevron" data-del="${j.id}" aria-label="Apagar">${icon('trash', 15)}</button>
          </div>
          <div class="journal-text selectable" contenteditable="true" data-edit="${j.id}">${esc(j.text)}</div>
        </article>`).join('')
      : `<div class="empty">${icon('pen', 44)}<div class="empty-title">Nada escrito ainda</div>
         <div class="empty-text">O que você anota hoje vira memória do quanto evoluiu.</div></div>`}`;
  },
  mount(root, params, ctx = {}) {
    qs('#jSave', root).addEventListener('click', async () => {
      const t = qs('#jText', root).value.trim();
      if (!t) return toast('Escreva algo antes de salvar');
      await store.addJournal(t);
      toast('Entrada salva', 'ok');
      refresh();
    });
    /* edição inline com autosave ao sair do campo */
    qsa('[data-edit]', root).forEach(el => {
      let t;
      const save = async () => { await store.updateJournal(+el.dataset.edit, el.textContent.trim()); flashSaved(); };
      el.addEventListener('input', () => { clearTimeout(t); t = setTimeout(save, 600); });
      el.addEventListener('blur', save);
    });
    qsa('[data-del]', root).forEach(b => b.addEventListener('click', async () => {
      await store.removeJournal(+b.dataset.del);
      haptic(); toast('Entrada apagada'); refresh();
    }));
  }
};
