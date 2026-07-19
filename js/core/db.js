/* ============================================================================
 * DB — wrapper mínimo de IndexedDB baseado em Promises. Sem dependências.
 * Nenhuma view fala com este módulo diretamente: tudo passa por store.js.
 * ========================================================================== */
import { DB_NAME, DB_VERSION, STORES, MIGRATIONS } from './schema.js';

let _db = null;

/** Abre (e se necessário atualiza) o banco. Idempotente. */
export function open() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    // Somente ADITIVO: cria o que falta, jamais remove.
    req.onupgradeneeded = e => {
      const db = req.result;
      for (const [name, def] of Object.entries(STORES)) {
        let os;
        if (!db.objectStoreNames.contains(name)) {
          os = db.createObjectStore(name, {
            keyPath: def.keyPath,
            autoIncrement: !!def.autoIncrement
          });
        } else {
          os = e.target.transaction.objectStore(name);
        }
        for (const ix of def.indexes || []) {
          if (!os.indexNames.contains(ix.name)) {
            os.createIndex(ix.name, ix.keyPath, ix.options || {});
          }
        }
      }
    };

    req.onsuccess = () => {
      _db = req.result;
      // Se outra aba pedir upgrade, fechamos para não bloquear.
      _db.onversionchange = () => { _db.close(); _db = null; };
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

function tx(storeName, mode = 'readonly') {
  return open().then(db => db.transaction(storeName, mode).objectStore(storeName));
}
const wrap = req => new Promise((res, rej) => {
  req.onsuccess = () => res(req.result);
  req.onerror = () => rej(req.error);
});

export const put    = (s, v)  => tx(s, 'readwrite').then(os => wrap(os.put(v)));
export const get    = (s, k)  => tx(s).then(os => wrap(os.get(k)));
export const del    = (s, k)  => tx(s, 'readwrite').then(os => wrap(os.delete(k)));
export const all    = s       => tx(s).then(os => wrap(os.getAll()));
export const clear  = s       => tx(s, 'readwrite').then(os => wrap(os.clear()));
export const byIndex = (s, ix, query) =>
  tx(s).then(os => wrap(os.index(ix).getAll(query)));

/** Grava vários registros numa única transação (usado na importação). */
export function putMany(storeName, records) {
  return open().then(db => new Promise((res, rej) => {
    const t = db.transaction(storeName, 'readwrite');
    const os = t.objectStore(storeName);
    records.forEach(r => os.put(r));
    t.oncomplete = () => res(records.length);
    t.onerror = () => rej(t.error);
  }));
}

/** Executa migrações de dados ainda não aplicadas e registra em `meta`. */
export async function runMigrations() {
  const done = (await get('meta', 'migrations'))?.value || [];
  const pending = MIGRATIONS.filter(m => !done.includes(m.id));
  for (const m of pending) {
    await m.run({ put, get, del, all, byIndex, putMany });
    done.push(m.id);
  }
  if (pending.length) await put('meta', { key: 'migrations', value: done });
  return pending.length;
}

/** Diagnóstico: quantos registros existem em cada store. */
export async function counts() {
  const out = {};
  for (const name of Object.keys(STORES)) out[name] = (await all(name)).length;
  return out;
}
