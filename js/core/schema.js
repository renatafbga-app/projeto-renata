/* ============================================================================
 * SCHEMA — definição do banco de dados do usuário.
 *
 * DECISÃO ARQUITETURAL 1 — Separação total entre APP e DADOS
 *   • Estrutura do app  → arquivos estáticos (data/*.js, js/*, css/*), servidos
 *                          e cacheados pelo Service Worker. Descartáveis.
 *   • Dados do usuário  → IndexedDB "projeto-renata-user" + chaves localStorage
 *                          com prefixo "pr.user.". NUNCA tocados pelo SW.
 *   Atualizar o app significa trocar arquivos estáticos e limpar caches.
 *   Nada disso alcança o IndexedDB — por isso uma nova versão jamais apaga dados.
 *
 * DECISÃO ARQUITETURAL 2 — Migrações somente aditivas
 *   onupgradeneeded apenas CRIA object stores/índices que ainda não existem.
 *   Nunca há deleteObjectStore. Se um campo mudar de forma, escrevemos uma
 *   migração de dados em MIGRATIONS (ver runMigrations em db.js), que roda uma
 *   única vez e fica registrada no store "meta".
 *
 * DECISÃO ARQUITETURAL 3 — Multi-perfil desde a fundação
 *   Todo registro carrega o campo `profile`. Hoje existe só o perfil "default",
 *   mas a estrutura já permite vários sem nenhuma migração destrutiva.
 * ========================================================================== */

export const DB_NAME = 'projeto-renata-user';
export const DB_VERSION = 1;

/** Prefixo de TODAS as chaves de usuário no localStorage. */
export const LS_PREFIX = 'pr.user.';

/**
 * Object stores. Chaves compostas em string (`profile:...`) evitam índices
 * complexos e tornam leitura/escrita determinísticas.
 */
export const STORES = {
  /** Um registro por dia de treino executado. id = `${profile}:${day}` */
  workouts: {
    keyPath: 'id',
    indexes: [
      { name: 'profile', keyPath: 'profile' },
      { name: 'profile_day', keyPath: ['profile', 'day'] }
    ]
  },

  /** Log achatado de séries — alimenta o histórico de carga por exercício. */
  sets: {
    keyPath: 'id', autoIncrement: true,
    indexes: [
      { name: 'profile_ex', keyPath: ['profile', 'exKey'] },
      { name: 'profile_date', keyPath: ['profile', 'date'] }
    ]
  },

  /**
   * Tudo que é "um valor por dia" mora aqui, unificado.
   * kind ∈ weight | measures | water | meals | sleep | mood | knee
   * id = `${profile}:${kind}:${date}`
   */
  daily: {
    keyPath: 'id',
    indexes: [
      { name: 'profile_kind', keyPath: ['profile', 'kind'] },
      { name: 'profile_date', keyPath: ['profile', 'date'] }
    ]
  },

  /** Diário livre — várias entradas por data. */
  journal: {
    keyPath: 'id', autoIncrement: true,
    indexes: [
      { name: 'profile', keyPath: 'profile' },
      { name: 'profile_date', keyPath: ['profile', 'date'] }
    ]
  },

  /** Metadados internos: versão de schema, migrações aplicadas, carimbos. */
  meta: { keyPath: 'key' }
};

/** Tipos válidos do store `daily`. */
export const DAILY_KINDS = ['weight', 'measures', 'water', 'meals', 'sleep', 'mood', 'knee'];

/**
 * Migrações de DADOS (não de estrutura). Cada uma roda no máximo uma vez.
 * Exemplo de uso futuro:
 *   { id: '2026-08-water-ml', run: async (db) => { ...converte litros em ml... } }
 */
export const MIGRATIONS = [];

/** Valores padrão das configurações. Merge raso na leitura → novas chaves em
 *  versões futuras aparecem automaticamente sem apagar as escolhas do usuário. */
export const DEFAULT_SETTINGS = {
  theme: 'dark',
  goalWeight: 65,
  startWeight: 75,
  heightCm: 170,
  waterGoal: 3000,
  workoutTime: '18:00',
  mealTimes: { breakfast: '07:00', lunch: '12:30', dinner: '19:30' },
  freeMode: false,          // false = dias desbloqueiam em sequência
  reminders: {
    enabled: true,
    workout: true, water: true, meals: false, weight: true, sleep: false
  },
  units: { weight: 'kg', length: 'cm', volume: 'ml' }
};
