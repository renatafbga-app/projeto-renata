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
export const DB_VERSION = 3;   // v3: store `foods` (alimentos personalizados)

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

  /**
   * Evolução por Fotos. Um registro por data, com até 4 ângulos.
   * As imagens são guardadas como data URL (JPEG comprimido no aparelho),
   * e não como Blob, por dois motivos: entram no backup JSON sem conversão
   * e sobrevivem a exportar/importar sem perda.
   * id = `${profile}:${date}`
   */
  photos: {
    keyPath: 'id',
    indexes: [
      { name: 'profile', keyPath: 'profile' },
      { name: 'profile_date', keyPath: ['profile', 'date'] }
    ]
  },

  /**
   * Alimentos da usuária: criados por ela, edições sobre itens do catálogo e
   * marcações de remoção. O catálogo estático (data/foods.data.js) nunca é
   * alterado — ele é conteúdo do app. Aqui ficam apenas as diferenças.
   * id = `${profile}:${foodId}`
   */
  foods: {
    keyPath: 'id',
    indexes: [{ name: 'profile', keyPath: 'profile' }]
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

/** Ângulos fotografados, na ordem em que aparecem na tela. */
export const PHOTO_SLOTS = [
  { key: 'front', nome: 'Frente' },
  { key: 'right', nome: 'Perfil direito' },
  { key: 'left',  nome: 'Perfil esquerdo' },
  { key: 'back',  nome: 'Costas' }
];

/** Medidas corporais registradas, em centímetros. */
export const MEASURE_FIELDS = [
  { key: 'waist',   nome: 'Cintura' },
  { key: 'abdomen', nome: 'Abdômen' },
  { key: 'hip',     nome: 'Quadril' },
  { key: 'armR',    nome: 'Braço direito' },
  { key: 'armL',    nome: 'Braço esquerdo' },
  { key: 'thighR',  nome: 'Coxa direita' },
  { key: 'thighL',  nome: 'Coxa esquerda' },
  { key: 'calfR',   nome: 'Panturrilha direita' },
  { key: 'calfL',   nome: 'Panturrilha esquerda' }
];

/** Categorias da Central de Lembretes. */
export const REMINDER_CATEGORIES = [
  { key: 'water',    nome: 'Água',        tipo: 'horarios' },
  { key: 'workout',  nome: 'Treino',      tipo: 'horarios' },
  { key: 'meals',    nome: 'Alimentação', tipo: 'horarios' },
  { key: 'weight',   nome: 'Peso',        tipo: 'semanal'  },
  { key: 'measures', nome: 'Medidas',     tipo: 'intervalo' },
  { key: 'photos',   nome: 'Fotos',       tipo: 'intervalo' }
];

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
  calorieGoal: 1700,        // meta diária do diário nutricional
  proteinGoal: 110,         // gramas
  reminders: {
    enabled: true,
    water:    { on: true,  times: ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'] },
    workout:  { on: true,  times: ['18:00'] },
    meals:    { on: false, times: ['07:00', '12:30', '19:30'] },
    weight:   { on: true,  weekday: 0, time: '08:00' },   // 0 = domingo
    measures: { on: true,  everyDays: 15, time: '08:30' },
    photos:   { on: true,  everyDays: 30, time: '09:00' }
  },
  units: { weight: 'kg', length: 'cm', volume: 'ml' }
};
