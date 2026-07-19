import { icon } from '../icons.js';
import { refresh } from '../router.js';
import { qs, qsa, toast, haptic, sheet } from '../ui.js';
import * as store from '../core/store.js';
import * as backup from '../core/backup.js';
import * as notif from '../core/notifications.js';
import { bindAutosave } from '../core/autosave.js';
import { applyTheme, APP_VERSION } from '../app.js';
import { db } from '../core/store.js';

export default {
  title: 'Configurações', subtitle: 'Metas, tema e backup',
  async render() {
    const s = store.getSettings();
    const theme = document.documentElement.dataset.theme;
    const perm = notif.permission();
    const counts = await db.counts();
    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);

    return `
      <div class="section-header"><span class="section-title">Aparência</span></div>
      <div class="list"><div class="row">
        <div class="row-icon">${icon(theme === 'dark' ? 'moon' : 'sun', 18)}</div>
        <div class="row-body"><div class="row-title">Tema</div></div>
        <div class="segmented" style="width:150px">
          <button data-theme="dark" class="${theme === 'dark' ? 'active' : ''}">Escuro</button>
          <button data-theme="light" class="${theme === 'light' ? 'active' : ''}">Claro</button>
        </div></div></div>

      <div class="section-header"><span class="section-title">Metas</span></div>
      <div class="card">
        <div class="field"><label class="field-label">Meta de peso (kg)</label>
          <input class="input" type="number" step="0.1" value="${s.goalWeight}" data-save="goalWeight"></div>
        <div class="field"><label class="field-label">Altura (cm) — usada no IMC</label>
          <input class="input" type="number" value="${s.heightCm}" data-save="heightCm"></div>
        <div class="field"><label class="field-label">Meta de água (ml)</label>
          <input class="input" type="number" step="250" value="${s.waterGoal}" data-save="waterGoal"></div>
        <div class="field mb-0"><label class="field-label">Horário do treino</label>
          <input class="input" type="time" value="${s.workoutTime}" data-save="workoutTime"></div>
      </div>

      <div class="section-header"><span class="section-title">Horários das refeições</span></div>
      <div class="card">
        <div class="field"><label class="field-label">Café da manhã</label>
          <input class="input" type="time" value="${s.mealTimes.breakfast}" data-save="meal.breakfast"></div>
        <div class="field"><label class="field-label">Almoço</label>
          <input class="input" type="time" value="${s.mealTimes.lunch}" data-save="meal.lunch"></div>
        <div class="field mb-0"><label class="field-label">Jantar</label>
          <input class="input" type="time" value="${s.mealTimes.dinner}" data-save="meal.dinner"></div>
      </div>

      <div class="section-header"><span class="section-title">Treinos</span></div>
      <div class="list">
        <div class="row">
          <div class="row-icon">${icon('lock', 18)}</div>
          <div class="row-body"><div class="row-title">Modo livre</div>
            <div class="row-sub">Abrir qualquer dia sem seguir a ordem</div></div>
          <div class="toggle ${s.freeMode ? 'on' : ''}" data-flag="freeMode"></div>
        </div>
      </div>

      <div class="section-header"><span class="section-title">Lembretes</span></div>
      <div class="list">
        <div class="row">
          <div class="row-icon">${icon('bell', 18)}</div>
          <div class="row-body"><div class="row-title">Ativar lembretes</div>
            <div class="row-sub">Permissão: ${perm === 'granted' ? 'concedida'
              : perm === 'denied' ? 'negada nos ajustes do iPhone' : 'ainda não solicitada'}</div></div>
          <div class="toggle ${s.reminders.enabled ? 'on' : ''}" data-rem="enabled"></div>
        </div>
        ${[['workout','Treino'],['water','Água'],['meals','Refeições'],['weight','Peso'],['sleep','Sono']]
          .map(([k, label]) => `<div class="row">
            <div class="row-body"><div class="row-title">${label}</div></div>
            <div class="toggle ${s.reminders[k] ? 'on' : ''}" data-rem="${k}"></div></div>`).join('')}
      </div>
      <div class="callout note"><span class="t">Como funciona no iPhone</span>
        Sem um servidor de push, o iOS não entrega notificação com o app fechado.
        Os lembretes chegam quando o app está aberto, e os pendentes do dia
        aparecem assim que você o abre.</div>

      <div class="section-header"><span class="section-title">Dados</span></div>
      <div class="list">
        <button class="row" id="btnExport">
          <div class="row-icon">${icon('download', 18)}</div>
          <div class="row-body"><div class="row-title">Exportar backup</div>
            <div class="row-sub">${totalRecords} registros salvos</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></button>
        <button class="row" id="btnImport">
          <div class="row-icon">${icon('upload', 18)}</div>
          <div class="row-body"><div class="row-title">Importar backup</div>
            <div class="row-sub">Restaura de um arquivo JSON</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></button>
        <button class="row" id="btnHealth">
          <div class="row-icon">${icon('heart', 18)}</div>
          <div class="row-body"><div class="row-title">Exportar peso (CSV)</div>
            <div class="row-sub">Compatível com planilhas e app Saúde</div></div>
          <span class="row-chevron">${icon('chevron', 15)}</span></button>
      </div>
      <input type="file" id="fileInput" accept="application/json" hidden>

      <div class="list"><button class="row" id="btnReset">
        <div class="row-icon" style="background:rgba(255,69,58,.18);color:#FF453A">${icon('trash', 18)}</div>
        <div class="row-body"><div class="row-title" style="color:var(--red)">Apagar todos os dados</div>
          <div class="row-sub">Não pode ser desfeito</div></div></button></div>

      <p class="tiny muted center mt-4">Projeto Renata · versão ${APP_VERSION}<br>
        Seus dados ficam only neste aparelho e sobrevivem a atualizações do app.</p>`;
  },

  mount(root, params, ctx = {}) {
    /* tema */
    qsa('[data-theme]', root).forEach(b => b.addEventListener('click', () => {
      applyTheme(b.dataset.theme);
      qsa('[data-theme]', root).forEach(x => x.classList.toggle('active', x === b));
      haptic();
    }));

    /* campos numéricos e horários — autosave */
    bindAutosave(root, (field, value) => {
      if (field.startsWith('meal.')) {
        const k = field.split('.')[1];
        store.setSettings({ mealTimes: { ...store.getSettings().mealTimes, [k]: value } });
      } else {
        const num = ['goalWeight', 'heightCm', 'waterGoal'].includes(field);
        store.setSettings({ [field]: num ? parseFloat(String(value).replace(',', '.')) || 0 : value });
      }
    }, ctx);

    /* toggles simples */
    qsa('[data-flag]', root).forEach(t => t.addEventListener('click', () => {
      const on = t.classList.toggle('on'); haptic();
      store.setSettings({ [t.dataset.flag]: on });
      toast(on ? 'Modo livre ativado' : 'Desbloqueio em sequência');
    }));

    /* toggles de lembrete */
    qsa('[data-rem]', root).forEach(t => t.addEventListener('click', async () => {
      const on = t.classList.toggle('on'); haptic();
      const k = t.dataset.rem;
      store.setSettings({ reminders: { ...store.getSettings().reminders, [k]: on } });
      if (on && k === 'enabled') {
        const p = await notif.requestPermission();
        if (p !== 'granted') toast('Sem permissão: usarei avisos dentro do app');
      }
    }));

    /* backup */
    qs('#btnExport', root).addEventListener('click', async () => {
      await backup.downloadBackup();
      toast('Backup exportado', 'ok');
    });
    qs('#btnImport', root).addEventListener('click', () => qs('#fileInput', root).click());
    qs('#fileInput', root).addEventListener('change', async e => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const n = await backup.importData(data, 'merge');
        toast(`${n} registros importados`, 'ok');
        setTimeout(refresh, 500);
      } catch (err) { toast('Arquivo inválido: ' + err.message); }
    });
    qs('#btnHealth', root).addEventListener('click', async () => {
      const { AppleHealth } = await import('../core/adapters.js');
      const csv = await AppleHealth.exportWeightCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'peso-projeto-renata.csv';
      a.click(); toast('CSV exportado', 'ok');
    });

    /* apagar tudo — confirmação dupla, padrão iOS */
    qs('#btnReset', root).addEventListener('click', () => {
      sheet({
        title: 'Apagar todos os dados?',
        body: `<p class="muted" style="margin-bottom:18px">
            Isto remove treinos, cargas, peso, medidas, diário e configurações
            deste aparelho. O conteúdo do livro permanece. Não há como desfazer.</p>
          <button class="btn block" style="background:var(--red);color:#fff" id="cfmReset">
            Sim, apagar tudo</button>
          <button class="btn ghost block mt-2" data-dismiss>Cancelar</button>`,
        onMount(layer, close) {
          qs('#cfmReset', layer).addEventListener('click', async () => {
            await backup.wipeAll(); close();
            toast('Dados apagados');
            setTimeout(refresh, 400);
          });
        }
      });
    });
  }
};
