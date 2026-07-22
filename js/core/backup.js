/* ============================================================================
 * BACKUP — exportação e importação de 100% dos dados do usuário.
 *
 * Como TUDO passa pelo store, o backup enxerga todos os dados por construção.
 * O arquivo é JSON legível, versionado, e serve também como formato de partida
 * para a futura sincronização em nuvem.
 * ========================================================================== */
import * as db from './db.js';
import { STORES, LS_PREFIX, DB_VERSION } from './schema.js';
import * as store from './store.js';
import { hojeISO } from './dates.js';

export const BACKUP_FORMAT = 2;

export async function exportData() {
  const payload = {
    format: BACKUP_FORMAT,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    app: 'Projeto Renata',
    profiles: store.listProfiles(),
    activeProfile: store.activeProfile(),
    localStorage: {},
    stores: {}
  };
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(LS_PREFIX)) payload.localStorage[k] = localStorage.getItem(k);
  }
  for (const name of Object.keys(STORES)) payload.stores[name] = await db.all(name);
  return payload;
}

export async function downloadBackup() {
  const data = await exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projeto-renata-backup-${hojeISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return data;
}

/**
 * Importa um backup.
 * @param {object} data
 * @param {'merge'|'replace'} mode  merge = preserva o que existe e sobrescreve iguais.
 */
export async function importData(data, mode = 'merge') {
  if (!data || typeof data !== 'object' || !data.stores || typeof data.stores !== 'object')
    throw new Error('Arquivo de backup inválido.');
  if (typeof data.format !== 'number' || Number.isNaN(data.format))
    throw new Error('Backup sem versão de formato — arquivo provavelmente corrompido.');
  if (data.format > BACKUP_FORMAT)
    throw new Error('Este backup vem de uma versão mais nova do aplicativo.');

  if (mode === 'replace') {
    for (const name of Object.keys(STORES)) await db.clear(name);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k.startsWith(LS_PREFIX)) localStorage.removeItem(k);
    }
  }
  /* SEGURANÇA: um arquivo adulterado não pode gravar chaves arbitrárias no
     localStorage do domínio. Só aceitamos o nosso prefixo. */
  for (const [k, v] of Object.entries(data.localStorage || {})) {
    if (!k.startsWith(LS_PREFIX)) { console.warn('[backup] chave ignorada:', k); continue; }
    if (typeof v !== 'string') { console.warn('[backup] valor inválido em', k); continue; }
    try { localStorage.setItem(k, v); }
    catch (err) { console.warn('[backup] não consegui gravar', k, err); }
  }
  let n = 0;
  for (const [name, rows] of Object.entries(data.stores)) {
    if (!STORES[name] || !Array.isArray(rows) || !rows.length) continue;
    // `sets` e `journal` usam autoIncrement: no merge deixamos o banco gerar id novo
    // descarta entradas que não sejam objetos (arquivo adulterado)
    const valid = rows.filter(r => r && typeof r === 'object' && !Array.isArray(r));
    if (valid.length !== rows.length)
      console.warn(`[backup] ${rows.length - valid.length} registro(s) inválido(s) em "${name}" ignorado(s)`);
    const clean = (name === 'sets' || name === 'journal') && mode === 'merge'
      ? valid.map(({ id, ...rest }) => rest) : valid;
    n += await db.putMany(name, clean);
  }
  return n;
}

/** Apaga TODOS os dados do usuário. Não toca nos arquivos do app. */
export async function wipeAll() {
  for (const name of Object.keys(STORES)) await db.clear(name);
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k.startsWith(LS_PREFIX)) localStorage.removeItem(k);
  }
  return true;
}
