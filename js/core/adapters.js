/* ============================================================================
 * ADAPTADORES — pontos de extensão para o futuro.
 *
 * Nenhum destes recursos está ativo agora. Eles existem para que a integração
 * futura seja PLUGAR um adaptador, sem reescrever a aplicação.
 *
 * O contrato é sempre o mesmo:
 *   isAvailable() → boolean      o ambiente suporta?
 *   connect()     → Promise      autoriza/conecta
 *   push(data)    → Promise      envia dados nossos para fora
 *   pull()        → Promise      traz dados de fora para cá
 *
 * Todos consomem e devolvem o MESMO formato do backup.js, que é a nossa
 * "moeda" universal de dados. Isso é o que torna a troca barata.
 * ========================================================================== */
import * as store from './store.js';
import { exportData, importData } from './backup.js';

/* -------------------------------------------------------- 1. Apple Health */
/**
 * Safari não expõe HealthKit à web. Dois caminhos viáveis no futuro:
 *   a) empacotar o PWA em um app nativo (WKWebView) e fazer a ponte;
 *   b) importar/exportar arquivos do app Saúde (XML/CSV) manualmente.
 * O caminho (b) já é implementável hoje sem nenhum servidor.
 */
export const AppleHealth = {
  id: 'apple-health',
  isAvailable: () => typeof window !== 'undefined' && !!window.webkit?.messageHandlers?.health,
  async connect() { throw new Error('Apple Health exige empacotamento nativo (WKWebView).'); },
  /** Formato-alvo: [{type:'bodyMass', date, value, unit}] */
  async push() { return { skipped: true, reason: 'sem ponte nativa' }; },
  async pull() { return []; },
  /** Caminho (b): converte nossos pesos para CSV compatível com o app Saúde. */
  async exportWeightCSV() {
    const rows = await store.series('weight');
    return 'date,weight_kg\n' + rows.map(r => `${r.date},${r.v}`).join('\n');
  }
};

/* --------------------------------------------------------- 2. Apple Watch */
/**
 * O Watch não conversa com PWA diretamente. Quando houver app nativo, este
 * adaptador recebe as sessões de treino e a frequência cardíaca.
 */
export const AppleWatch = {
  id: 'apple-watch',
  isAvailable: () => false,
  async connect() { throw new Error('Requer app nativo companheiro.'); },
  /** Entrada esperada: {day, durationSec, kcal, avgHr, maxHr} */
  async pushWorkout() { return { skipped: true }; }
};

/* ------------------------------------------------------ 3. Sync em nuvem */
/**
 * Sincronização é "último a escrever vence" por registro, usando updatedAt.
 * Basta implementar `transport` (fetch para uma API, iCloud, Supabase, etc.).
 */
export const CloudSync = {
  id: 'cloud',
  transport: null,          // injetar: { get(key), set(key, value) }
  isAvailable() { return !!this.transport; },
  async push() {
    if (!this.isAvailable()) throw new Error('Nenhum transporte configurado.');
    const data = await exportData();
    await this.transport.set(`renata/${store.activeProfile()}`, data);
    return data.exportedAt;
  },
  async pull(mode = 'merge') {
    if (!this.isAvailable()) throw new Error('Nenhum transporte configurado.');
    const data = await this.transport.get(`renata/${store.activeProfile()}`);
    return data ? importData(data, mode) : 0;
  }
};

/* ---------------------------------------------------------------- 4. IA */
/**
 * Ponto único para inteligência. Hoje roda uma heurística local (offline!).
 * Amanhã, basta trocar `provider` por uma chamada de API — a interface do app
 * não muda.
 */
export const AI = {
  id: 'ai',
  provider: null,           // injetar: async ({prompt, context}) => string
  isAvailable() { return true; },        // sempre há o modo local
  /** Comentário curto sobre o momento da usuária. */
  async insight(ctx) {
    if (this.provider) return this.provider({ prompt: 'insight', context: ctx });
    // heurística local, sem rede
    if (ctx.knee != null && ctx.knee >= 4)
      return 'O joelho pediu atenção. Mantenha as cargas e capriche na rotina de proteção.';
    if (ctx.streak >= 5) return `${ctx.streak} dias seguidos. É assim que o hábito vira identidade.`;
    if (ctx.waterPct < 50) return 'A hidratação está atrasada hoje — um copo agora já ajuda.';
    if (ctx.lost > 0) return `Você já eliminou ${ctx.lost} kg. O trabalho está aparecendo.`;
    return 'Um dia de cada vez. Abra o treino de hoje e execute.';
  }
};

/* ------------------------------------------------------ 5. Múltiplos perfis */
/** O store já é multi-perfil; isto é apenas a fachada de alto nível. */
export const Profiles = {
  list: () => store.listProfiles(),
  active: () => store.activeProfile(),
  create: name => store.createProfile(name),
  switchTo: id => store.setActiveProfile(id)
};

export const ADAPTERS = { AppleHealth, AppleWatch, CloudSync, AI, Profiles };
