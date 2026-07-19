/* Central de Lembretes — cada categoria com sua própria regra de recorrência. */
import { icon } from '../icons.js';
import { qs, qsa, esc, toast, haptic, sheet } from '../ui.js';
import * as store from '../core/store.js';
import * as notif from '../core/notifications.js';
import { refresh } from '../router.js';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const CATS = [
  { key: 'water',    nome: 'Água',        icone: 'drop',     tipo: 'horarios',
    desc: 'Avisos ao longo do dia até bater a meta' },
  { key: 'workout',  nome: 'Treino',      icone: 'dumbbell', tipo: 'horarios',
    desc: 'Lembrete no horário que você treina' },
  { key: 'meals',    nome: 'Alimentação', icone: 'meal',     tipo: 'horarios',
    desc: 'Avisa quando uma refeição não foi registrada' },
  { key: 'weight',   nome: 'Peso',        icone: 'scale',    tipo: 'semanal',
    desc: 'Uma vez por semana, sempre no mesmo dia' },
  { key: 'measures', nome: 'Medidas',     icone: 'ruler',    tipo: 'intervalo',
    desc: 'A cada tantos dias, a contar do último registro' },
  { key: 'photos',   nome: 'Fotos',       icone: 'grid',     tipo: 'intervalo',
    desc: 'Para manter a linha do tempo em dia' }
];

const resumo = (cat, cfg) => {
  if (!cfg?.on) return 'Desativado';
  if (cat.tipo === 'horarios') {
    const t = cfg.times || [];
    if (!t.length) return 'Sem horários definidos';
    return t.length <= 3 ? t.join(' · ') : `${t.length} horários por dia`;
  }
  if (cat.tipo === 'semanal') return `${DIAS[cfg.weekday ?? 0]} às ${cfg.time || '08:00'}`;
  return `A cada ${cfg.everyDays || 30} dias, às ${cfg.time || '09:00'}`;
};

export default {
  compact: true,
  backLabel: 'Configurações',
  title: 'Central de Lembretes',
  async render() {
    const s = store.getSettings();
    const r = s.reminders || {};
    const permissao = notif.permission();
    const pendentes = await notif.dueReminders();

    const aviso = {
      granted: ['green', 'Permissão concedida — os lembretes chegam como notificação.'],
      denied: ['red', 'Permissão negada nos Ajustes do iPhone. Os lembretes vão aparecer dentro do app.'],
      default: ['yellow', 'Permissão ainda não solicitada. Ative abaixo para receber notificações.'],
      unsupported: ['', 'Este navegador não oferece notificações. Os lembretes aparecem dentro do app.']
    }[permissao] || ['', ''];

    return `
      <h2 style="font-size:26px;font-weight:700;letter-spacing:-.6px;margin-bottom:6px">
        Central de Lembretes
      </h2>
      <p class="muted" style="margin-bottom:18px">
        Escolha o que você quer que o app lembre — e a que horas.
      </p>

      <div class="list">
        <div class="row">
          <div class="row-icon ${r.enabled ? 'tint' : ''}">${icon('bell', 18)}</div>
          <div class="row-body">
            <div class="row-title">Ativar lembretes</div>
            <div class="row-sub">Chave geral de todas as categorias</div>
          </div>
          <div class="toggle ${r.enabled ? 'on' : ''}" data-geral></div>
        </div>
      </div>

      <div class="callout ${aviso[0] === 'red' ? 'knee' : aviso[0] === 'green' ? 'tip' : 'note'}">
        <span class="t">Estado da permissão</span>
        <p>${esc(aviso[1])}</p>
        ${permissao === 'default'
          ? `<button class="btn sm primary mt-2" id="pedirPermissao">Permitir notificações</button>` : ''}
      </div>

      <div class="section-header"><span class="section-title">Categorias</span></div>
      <div class="list">
        ${CATS.map(c => {
          const cfg = r[c.key] || {};
          return `
          <div class="row">
            <div class="row-icon ${cfg.on && r.enabled ? 'teal' : ''}">${icon(c.icone, 18)}</div>
            <button class="row-body" data-editar="${c.key}" style="text-align:left;background:none;padding:0">
              <div class="row-title">${c.nome}</div>
              <div class="row-sub">${esc(resumo(c, cfg))}</div>
            </button>
            <div class="toggle ${cfg.on ? 'on' : ''}" data-cat="${c.key}"></div>
          </div>`;
        }).join('')}
      </div>
      <p class="tiny muted" style="margin:-4px 4px 0">
        Toque no nome da categoria para ajustar horários.
      </p>

      ${pendentes.length ? `
        <div class="section-header"><span class="section-title">Pendentes agora</span></div>
        <div class="list">
          ${pendentes.map(p => `
            <div class="row">
              <div class="row-icon">${icon('clock', 18)}</div>
              <div class="row-body">
                <div class="row-title">${esc(p.title)}</div>
                <div class="row-sub" style="white-space:normal">${esc(p.body)}</div>
              </div>
              <span class="row-value">${esc(p.time)}</span>
            </div>`).join('')}
        </div>` : ''}

      <div class="callout note">
        <span class="t">Como funciona no iPhone</span>
        <p>Sem um servidor de push, o iOS não entrega notificação com o app
        fechado. Enquanto o app estiver aberto, os avisos chegam no horário; e ao
        abrir o app, tudo o que ficou pendente no dia aparece aqui e na tela inicial.</p>
        <p>Este é o limite da plataforma, não uma escolha do aplicativo.</p>
      </div>`;
  },

  mount(root, params, ctx = {}) {
    const sig = { signal: ctx.signal };
    const patch = cfg => store.setSettings({ reminders: { ...store.getSettings().reminders, ...cfg } });

    qs('[data-geral]', root)?.addEventListener('click', async e => {
      const on = e.currentTarget.classList.toggle('on');
      haptic();
      patch({ enabled: on });
      if (on) {
        const p = await notif.requestPermission();
        if (p !== 'granted') toast('Sem permissão: os avisos aparecem dentro do app.');
      }
      refresh();
    }, sig);

    qs('#pedirPermissao', root)?.addEventListener('click', async () => {
      const p = await notif.requestPermission();
      toast(p === 'granted' ? 'Permissão concedida' : 'Permissão não concedida');
      refresh();
    }, sig);

    qsa('[data-cat]', root).forEach(t => t.addEventListener('click', () => {
      const key = t.dataset.cat;
      const on = t.classList.toggle('on');
      haptic();
      const atual = store.getSettings().reminders[key] || {};
      patch({ [key]: { ...atual, on } });
      refresh();
    }, sig));

    qsa('[data-editar]', root).forEach(b =>
      b.addEventListener('click', () => editar(b.dataset.editar), sig));

    function editar(key) {
      const cat = CATS.find(c => c.key === key);
      const cfg = store.getSettings().reminders[key] || {};

      const corpo = cat.tipo === 'horarios' ? `
        <p class="muted" style="margin-bottom:14px">${esc(cat.desc)}</p>
        <div id="listaHorarios">
          ${(cfg.times || []).map((t, i) => `
            <div class="hstack" style="margin-bottom:8px">
              <input class="input grow" type="time" value="${esc(t)}" data-hora="${i}">
              <button class="btn sm danger" data-remover-hora="${i}">Remover</button>
            </div>`).join('')}
        </div>
        <button class="btn block mt-2" id="addHorario">${icon('plus', 18)} Adicionar horário</button>
      ` : cat.tipo === 'semanal' ? `
        <p class="muted" style="margin-bottom:14px">${esc(cat.desc)}</p>
        <div class="field">
          <label class="field-label" for="diaSemana">Dia da semana</label>
          <select class="select" id="diaSemana">
            ${DIAS.map((d, i) => `<option value="${i}" ${Number(cfg.weekday ?? 0) === i ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label" for="horaSemanal">Horário</label>
          <input class="input" type="time" id="horaSemanal" value="${esc(cfg.time || '08:00')}">
        </div>
      ` : `
        <p class="muted" style="margin-bottom:14px">${esc(cat.desc)}</p>
        <div class="field">
          <label class="field-label">A cada quantos dias</label>
          <div class="segmented">
            ${[15, 30, 45].map(n => `
              <button data-intervalo="${n}" class="${Number(cfg.everyDays || 30) === n ? 'active' : ''}">${n} dias</button>
            `).join('')}
          </div>
        </div>
        <div class="field">
          <label class="field-label" for="horaIntervalo">Horário</label>
          <input class="input" type="time" id="horaIntervalo" value="${esc(cfg.time || '09:00')}">
        </div>`;

      sheet({
        title: cat.nome,
        body: corpo + `<button class="btn primary block" style="margin-top:18px" id="salvarCat">Salvar</button>`,
        onMount(layer, fechar) {
          let intervalo = Number(cfg.everyDays || 30);

          qs('#addHorario', layer)?.addEventListener('click', () => {
            const lista = qs('#listaHorarios', layer);
            const i = qsa('[data-hora]', layer).length;
            const div = document.createElement('div');
            div.className = 'hstack';
            div.style.marginBottom = '8px';
            div.innerHTML = `<input class="input grow" type="time" value="12:00" data-hora="${i}">
              <button class="btn sm danger" data-remover-hora="${i}">Remover</button>`;
            lista.appendChild(div);
            div.querySelector('[data-remover-hora]').addEventListener('click', () => div.remove());
          });

          qsa('[data-remover-hora]', layer).forEach(b =>
            b.addEventListener('click', () => b.closest('.hstack').remove()));

          qsa('[data-intervalo]', layer).forEach(b => b.addEventListener('click', () => {
            qsa('[data-intervalo]', layer).forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            intervalo = Number(b.dataset.intervalo);
            haptic();
          }));

          qs('#salvarCat', layer).addEventListener('click', () => {
            const atual = store.getSettings().reminders[key] || {};
            let novo;
            if (cat.tipo === 'horarios') {
              const times = qsa('[data-hora]', layer)
                .map(i => i.value).filter(Boolean)
                .sort((a, b) => a.localeCompare(b));
              if (!times.length) { toast('Defina ao menos um horário.'); return; }
              novo = { ...atual, on: true, times: [...new Set(times)] };
            } else if (cat.tipo === 'semanal') {
              novo = { ...atual, on: true,
                weekday: Number(qs('#diaSemana', layer).value),
                time: qs('#horaSemanal', layer).value || '08:00' };
            } else {
              novo = { ...atual, on: true, everyDays: intervalo,
                time: qs('#horaIntervalo', layer).value || '09:00' };
            }
            patch({ [key]: novo });
            fechar();
            toast(`${cat.nome}: lembretes atualizados`, 'ok');
            refresh();
          });
        }
      });
    }
  }
};
