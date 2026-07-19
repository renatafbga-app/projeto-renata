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
        <a class="row" href="#/lembretes">
          <div class="row-icon ${s.reminders.enabled ? 'tint' : ''}">${icon('bell', 18)}</div>
          <div class="row-body">
            <div class="row-title">Central de Lembretes</div>
            <div class="row-sub">
              ${s.reminders.enabled
                ? 'Água, treino, alimentação, peso, medidas e fotos'
                : 'Desativados'}
            </div>
          </div>
          <span class="row-chevron">${icon('chevron', 15)}</span>
        </a>
      </div>

      <div class="section-header"><span class="section-title">Nutrição</span></div>
      <div class="card">
        <div class="field">
          <label class="field-label" for="cfgKcal">Meta de calorias por dia</label>
          <input class="input" type="number" id="cfgKcal" value="${s.calorieGoal}" data-save="calorieGoal">
        </div>
        <div class="field mb-0">
          <label class="field-label" for="cfgProt">Meta de proteína por dia (g)</label>
          <input class="input" type="number" id="cfgProt" value="${s.proteinGoal}" data-save="proteinGoal">
        </div>
      </div>

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

      <div class="section-header"><span class="section-title">Versão e cache</span></div>
      <div class="list">
        <div class="row">
          <div class="row-icon">${icon('bolt', 18)}</div>
          <div class="row-body">
            <div class="row-title">Versão em execução</div>
            <div class="row-sub" id="versaoInfo">Aplicativo ${APP_VERSION} · consultando cache…</div>
          </div>
        </div>
        <button class="row" id="btnForcar">
          <div class="row-icon tint">${icon('download', 18)}</div>
          <div class="row-body">
            <div class="row-title">Forçar atualização</div>
            <div class="row-sub">Baixa a versão mais recente sem apagar seus dados</div>
          </div>
          <span class="row-chevron">${icon('chevron', 15)}</span>
        </button>
      </div>

      <p class="tiny muted center mt-4">Projeto Renata · versão ${APP_VERSION}<br>
        Seus dados ficam apenas neste aparelho e sobrevivem a atualizações do app.</p>`;
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
        const num = ['goalWeight', 'heightCm', 'waterGoal', 'calorieGoal', 'proteinGoal'].includes(field);
        store.setSettings({ [field]: num ? parseFloat(String(value).replace(',', '.')) || 0 : value });
      }
    }, ctx);

    /* toggles simples */
    qsa('[data-flag]', root).forEach(t => t.addEventListener('click', () => {
      const on = t.classList.toggle('on'); haptic();
      store.setSettings({ [t.dataset.flag]: on });
      toast(on ? 'Modo livre ativado' : 'Desbloqueio em sequência');
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

    /* versão realmente em execução: compara o app com o cache do Service Worker */
    (async () => {
      const alvo = qs('#versaoInfo', root);
      if (!alvo) return;
      if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
        alvo.textContent = `Aplicativo ${APP_VERSION} · sem Service Worker ativo`;
        return;
      }
      const versaoSW = await new Promise(resolve => {
        const canal = new MessageChannel();
        const t = setTimeout(() => resolve(null), 1500);
        navigator.serviceWorker.addEventListener('message', function ouvir(e) {
          if (e.data?.type === 'version') {
            clearTimeout(t);
            navigator.serviceWorker.removeEventListener('message', ouvir);
            resolve(e.data.version);
          }
        });
        navigator.serviceWorker.controller.postMessage('VERSION');
      });
      alvo.textContent = versaoSW
        ? `Aplicativo ${APP_VERSION} · cache ${versaoSW}`
        : `Aplicativo ${APP_VERSION} · cache não respondeu`;
    })();

    /* forçar atualização: limpa caches e recarrega. NÃO toca nos dados. */
    qs('#btnForcar', root)?.addEventListener('click', () => {
      sheet({
        title: 'Forçar atualização',
        body: `<p class="muted" style="margin-bottom:16px">
            Isto apaga os arquivos do aplicativo guardados neste aparelho e baixa
            tudo de novo. <strong>Seus treinos, cargas, fotos e registros não são
            afetados</strong> — eles ficam em outro lugar, que esta operação não alcança.
          </p>
          <p class="tiny muted" style="margin-bottom:16px">
            Use quando um botão não abrir a tela esperada ou quando uma novidade
            publicada não aparecer.
          </p>
          <button class="btn primary block" id="cfmForcar">Atualizar agora</button>
          <button class="btn ghost block mt-2" data-dismiss>Cancelar</button>`,
        onMount(layer, fechar) {
          qs('#cfmForcar', layer).addEventListener('click', async () => {
            fechar();
            toast('Baixando a versão mais recente…');
            try {
              if ('caches' in window) {
                const chaves = await caches.keys();
                await Promise.all(chaves
                  .filter(k => k.startsWith('projeto-renata-'))
                  .map(k => caches.delete(k)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
              }
            } catch (err) {
              console.warn('[atualização] falha ao limpar cache', err);
            }
            setTimeout(() => location.reload(true), 600);
          });
        }
      });
    }, { signal: ctx.signal });

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
