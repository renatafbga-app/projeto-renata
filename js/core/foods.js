/* ============================================================================
 * ALIMENTOS — catálogo consultável e escalável.
 *
 * A base tem duas camadas que se somam na leitura:
 *   1. CATÁLOGO  data/foods.data.js — conteúdo do app, imutável, cacheado
 *      pelo Service Worker como qualquer outro arquivo estático.
 *   2. USUÁRIA   store `foods` no IndexedDB — alimentos criados por ela,
 *      edições sobre itens do catálogo e marcações de remoção.
 *
 * Por que separado: o catálogo pode crescer para milhares de itens numa
 * atualização do app sem tocar nos dados da usuária; e o que ela criou
 * sobrevive a qualquer atualização, porque vive do outro lado da fronteira.
 *
 * A leitura mescla as duas camadas: edição sobrescreve o item de catálogo,
 * remoção o esconde, e alimentos próprios entram na lista normalmente.
 * ========================================================================== */
import { FOODS as CATALOGO, CATEGORIAS } from '../../data/foods.data.js';
import * as db from './db.js';
import { LS_PREFIX } from './schema.js';
import { activeProfile, safeSet } from './store.js';

export { CATEGORIAS };
export const CATEGORIA_PERSONALIZADOS = 'Meus alimentos';

const P = () => activeProfile();
const fid = foodId => `${P()}:${foodId}`;

/* ---------------------------------------------------------------- busca */
export const semAcento = s => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ------------------------------------------------------ camada da usuária */
async function diffsDaUsuaria() {
  const rows = await db.byIndex('foods', 'profile', IDBKeyRange.only(P()));
  const mapa = new Map();
  rows.forEach(r => mapa.set(r.foodId, r));
  return mapa;
}

/** Catálogo completo já mesclado com as alterações da usuária. */
export async function listarTodos() {
  const diffs = await diffsDaUsuaria();
  const saida = [];

  for (const base of CATALOGO) {
    const d = diffs.get(base.id);
    if (d?.removido) continue;                       // escondido pela usuária
    saida.push(d?.dados ? { ...base, ...d.dados, editado: true } : base);
  }
  // alimentos que só existem para a usuária
  for (const [, d] of diffs) {
    if (d.removido || !d.dados) continue;
    if (CATALOGO.some(b => b.id === d.foodId)) continue;
    saida.push({ ...d.dados, id: d.foodId, proprio: true });
  }
  return saida;
}

/** Busca por parte do nome ou da categoria, sem acento e sem caixa. */
export async function buscar(termo, { categoria = '', limite = 40 } = {}) {
  const todos = await listarTodos();
  const favs = new Set(await listarFavoritos());
  const recentes = await listarRecentes();
  const ordemRecente = new Map(recentes.map((r, i) => [r.id, i]));

  const q = semAcento(termo).trim();
  const qCat = semAcento(categoria);

  const textoBusca = f =>
    semAcento([f.nome, f.marca || '', (f.sin || []).join(' '), f.cat].join(' '));

  const filtrados = todos.filter(f => {
    if (categoria && semAcento(f.cat) !== qCat) return false;
    if (!q) return true;
    return textoBusca(f).includes(q);
  });

  return filtrados
    .map(f => {
      const nome = semAcento(f.nome);
      const posNome = q ? nome.indexOf(q) : 0;
      const casaSinonimo = q && (f.sin || []).some(x => semAcento(x).includes(q));
      const casaMarca = q && semAcento(f.marca || '').includes(q);
      // nome começando com o termo é o mais relevante; depois nome no meio;
      // depois marca; depois sinônimo; depois categoria
      const peso = posNome === 0 ? 0
                 : posNome > 0 ? 1
                 : casaMarca ? 2
                 : casaSinonimo ? 3 : 4;
      return { f, favorito: favs.has(f.id), recente: ordemRecente.has(f.id), peso };
    })
    .sort((a, b) =>
      // favoritos primeiro, depois recentes, depois relevância, depois alfabético
      (b.favorito - a.favorito) ||
      (b.recente - a.recente) ||
      (a.peso - b.peso) ||
      a.f.nome.localeCompare(b.f.nome, 'pt-BR'))
    .slice(0, limite)
    .map(x => ({ ...x.f, favorito: x.favorito }));
}

export async function acharAlimento(id) {
  return (await listarTodos()).find(f => f.id === id) || null;
}

/** Quantos itens existem por categoria (para a tela de navegação). */
export async function contarPorCategoria() {
  const todos = await listarTodos();
  const mapa = new Map();
  todos.forEach(f => mapa.set(f.cat, (mapa.get(f.cat) || 0) + 1));
  return mapa;
}

/* ------------------------------------------------------------- CRUD */
const CAMPOS_OBRIGATORIOS = ['nome', 'kcal', 'p', 'c', 'g'];

function validar(dados) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (dados[campo] === undefined || dados[campo] === null || dados[campo] === '')
      throw new Error(`Campo obrigatório ausente: ${campo}`);
  }
  const num = ['kcal', 'p', 'c', 'g', 'f', 'sod', 'ac', 'porcao'];
  const limpo = { ...dados };
  num.forEach(k => {
    if (limpo[k] !== undefined) {
      const v = parseFloat(String(limpo[k]).replace(',', '.'));
      limpo[k] = Number.isFinite(v) && v >= 0 ? v : 0;
    }
  });
  limpo.nome = String(limpo.nome).trim().slice(0, 80);
  limpo.cat = limpo.cat || CATEGORIA_PERSONALIZADOS;
  limpo.medida = limpo.medida || 'porção';
  limpo.plural = limpo.plural || (limpo.medida + 's');
  limpo.porcao = limpo.porcao > 0 ? limpo.porcao : 100;
  limpo.frac = limpo.frac !== false;
  return limpo;
}

/** Cria um alimento da usuária. */
export async function criarAlimento(dados) {
  const limpo = validar(dados);
  const id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  await db.put('foods', {
    id: fid(id), profile: P(), foodId: id,
    dados: { ...limpo, id }, criadoEm: new Date().toISOString()
  });
  return { ...limpo, id, proprio: true };
}

/** Edita um alimento — do catálogo ou próprio. */
export async function editarAlimento(foodId, dados) {
  const atual = await acharAlimento(foodId);
  if (!atual) throw new Error('Alimento não encontrado.');
  const limpo = validar({ ...atual, ...dados });
  await db.put('foods', {
    id: fid(foodId), profile: P(), foodId,
    dados: { ...limpo, id: foodId }, editadoEm: new Date().toISOString()
  });
  return { ...limpo, id: foodId };
}

/** Esconde um alimento. Itens do catálogo só recebem marca de remoção. */
export async function removerAlimento(foodId) {
  await db.put('foods', {
    id: fid(foodId), profile: P(), foodId,
    removido: true, removidoEm: new Date().toISOString()
  });
}

/** Desfaz remoção ou edição, voltando ao item original do catálogo. */
export async function restaurarAlimento(foodId) {
  await db.del('foods', fid(foodId));
}

/**
 * Importa uma lista de alimentos. Aceita o formato do próprio app.
 * Devolve quantos entraram e quantos foram recusados, com o motivo.
 */
export async function importarAlimentos(lista) {
  if (!Array.isArray(lista)) throw new Error('O arquivo precisa conter uma lista de alimentos.');
  let ok = 0;
  const recusados = [];
  for (const item of lista) {
    try {
      if (!item || typeof item !== 'object') throw new Error('registro inválido');
      await criarAlimento(item);
      ok++;
    } catch (err) {
      recusados.push({ nome: item?.nome ?? '(sem nome)', motivo: err.message });
    }
  }
  return { importados: ok, recusados };
}

/* --------------------------------------------------------- favoritos */
const K_FAV = () => `${LS_PREFIX}foods.fav.${P()}`;

export async function listarFavoritos() {
  try { return JSON.parse(localStorage.getItem(K_FAV()) || '[]'); } catch { return []; }
}
export async function alternarFavorito(foodId) {
  const atuais = await listarFavoritos();
  const novo = atuais.includes(foodId)
    ? atuais.filter(x => x !== foodId)
    : [foodId, ...atuais].slice(0, 100);
  safeSet(K_FAV(), JSON.stringify(novo));
  return novo.includes(foodId);
}
export const ehFavorito = async foodId => (await listarFavoritos()).includes(foodId);

/* ---------------------------------------------------------- recentes */
const K_REC = () => `${LS_PREFIX}foods.recent.${P()}`;
const MAX_RECENTES = 20;

export async function listarRecentes() {
  try { return JSON.parse(localStorage.getItem(K_REC()) || '[]'); } catch { return []; }
}
export async function registrarUso(foodId) {
  const atuais = (await listarRecentes()).filter(r => r.id !== foodId);
  const novo = [{ id: foodId, em: new Date().toISOString() }, ...atuais].slice(0, MAX_RECENTES);
  safeSet(K_REC(), JSON.stringify(novo));
  return novo;
}
/** Recentes já resolvidos para o alimento completo. */
export async function recentesCompletos(limite = 8) {
  const recentes = await listarRecentes();
  const todos = await listarTodos();
  const mapa = new Map(todos.map(f => [f.id, f]));
  return recentes.map(r => mapa.get(r.id)).filter(Boolean).slice(0, limite);
}

/* ---------------------------------------------- refeições favoritas
 * Combinações completas ("Meu café da manhã") que a usuária adiciona com um
 * toque. Ficam em localStorage sob o prefixo pr.user., então entram no backup.
 * -------------------------------------------------------------------------- */
const K_COMBOS = () => `${LS_PREFIX}foods.combos.${P()}`;

export async function listarRefeicoesFavoritas() {
  try { return JSON.parse(localStorage.getItem(K_COMBOS()) || '[]'); } catch { return []; }
}

/** Salva uma refeição favorita a partir de uma lista de itens já calculados. */
export async function salvarRefeicaoFavorita(nome, itens) {
  const limpo = String(nome || '').trim().slice(0, 60);
  if (!limpo) throw new Error('Dê um nome à refeição.');
  if (!Array.isArray(itens) || !itens.length) throw new Error('A refeição está vazia.');
  const atuais = await listarRefeicoesFavoritas();
  const combo = {
    id: 'c' + Date.now().toString(36),
    nome: limpo,
    itens: itens.map(i => ({
      nome: i.nome, foodId: i.foodId, qtd: i.qtd, medidaTexto: i.medidaTexto,
      gramas: i.gramas, kcal: i.kcal, p: i.p, c: i.c, g: i.g, f: i.f, sod: i.sod, ac: i.ac
    })),
    criadoEm: new Date().toISOString()
  };
  safeSet(K_COMBOS(), JSON.stringify([combo, ...atuais].slice(0, 50)));
  return combo;
}

export async function removerRefeicaoFavorita(id) {
  const atuais = await listarRefeicoesFavoritas();
  safeSet(K_COMBOS(), JSON.stringify(atuais.filter(c => c.id !== id)));
}

/* ------------------------------------------------------ cálculo de porção */
export const passoDe = food => (food.frac ? 0.5 : 1);

export const formatarQtd = q =>
  Number.isInteger(Number(q)) ? String(Number(q)) : String(Number(q)).replace('.', ',');

export function descreverMedida(food, qtd) {
  const n = Number(qtd) || 0;
  // até 1 fica no singular ("0,5 unidade", "1 concha"); acima vai para o plural
  const nome = n > 1 ? food.plural : food.medida;
  return `${formatarQtd(n)} ${nome}`;
}

export const gramasDe = (food, qtd) => Math.round((Number(qtd) || 0) * food.porcao);

/** Macros para uma quantidade em gramas. */
export function calcular(food, gramas) {
  const k = (Number(gramas) || 0) / 100;
  return {
    kcal: Math.round((food.kcal || 0) * k),
    p: +((food.p || 0) * k).toFixed(1),
    c: +((food.c || 0) * k).toFixed(1),
    g: +((food.g || 0) * k).toFixed(1),
    f: +((food.f || 0) * k).toFixed(1),
    sod: Math.round((food.sod || 0) * k),
    ac: +((food.ac || 0) * k).toFixed(1)
  };
}

/** Macros a partir da QUANTIDADE de medidas caseiras. */
export function calcularPorQuantidade(food, qtd) {
  const gramas = gramasDe(food, qtd);
  return { ...calcular(food, gramas), gramas, qtd: Number(qtd) || 0 };
}

/** Soma os macros de uma lista de itens já calculados. */
export function somar(itens) {
  return itens.reduce((t, i) => ({
    kcal: t.kcal + (i.kcal || 0),
    p: +(t.p + (i.p || 0)).toFixed(1),
    c: +(t.c + (i.c || 0)).toFixed(1),
    g: +(t.g + (i.g || 0)).toFixed(1),
    f: +(t.f + (i.f || 0)).toFixed(1),
    sod: t.sod + (i.sod || 0),
    ac: +(t.ac + (i.ac || 0)).toFixed(1)
  }), { kcal: 0, p: 0, c: 0, g: 0, f: 0, sod: 0, ac: 0 });
}
