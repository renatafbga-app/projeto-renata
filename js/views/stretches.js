/* Biblioteca de Alongamentos — catálogo completo. */
import { esc } from '../ui.js';
import { STRETCHES } from '../../data/stretches.data.js';
import { figure } from '../../data/figures.data.js';

export default {
  compact: true,
  backLabel: 'Biblioteca',
  title: 'Alongamentos',
  async render() {
    return `
      <h2 style="font-size:26px;font-weight:700;letter-spacing:-.6px;margin-bottom:6px">
        Biblioteca de Alongamentos
      </h2>
      <p class="muted" style="margin-bottom:18px">
        ${STRETCHES.length} alongamentos com passo a passo, respiração e cuidados.
        São os mesmos que aparecem ao final de cada treino.
      </p>

      <div class="lib-grid">
        ${STRETCHES.map(a => `
          <a class="lib-card" href="#/alongamentos/${a.id}">
            <div class="lib-fig">${figure(a.key)}</div>
            <div class="lib-body">
              <div class="lib-name">${esc(a.curto)}</div>
              <div class="lib-group">${esc(a.regiao)}</div>
            </div>
          </a>`).join('')}
      </div>

      <div class="callout tip">
        <span class="t">Como usar</span>
        <p>Faça a sequência inteira ao final de cada treino, com os músculos ainda
        aquecidos. Segure cada posição por 30 segundos, sem balançar.</p>
        <p>Alongar nunca deve doer — apenas repuxar levemente.</p>
      </div>`;
  }
};
