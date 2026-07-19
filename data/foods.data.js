/* ============================================================================
 * TABELA DE ALIMENTOS — valores por 100 g (ou por 100 ml quando líquido).
 * Fonte de referência: tabelas nutricionais brasileiras de domínio público
 * (TACO / IBGE) e rótulos de embalagem. Valores arredondados.
 *
 * Por que uma tabela local: o app precisa funcionar 100% offline e sem
 * servidor. Uma API de nutrição quebraria isso. A tabela cobre os alimentos
 * recomendados no capítulo de Nutrição do livro; o que faltar pode ser
 * lançado manualmente na própria tela.
 *
 * campos: kcal, p (proteína g), c (carboidrato g), g (gordura g), f (fibra g)
 * porcao: gramas de uma porção caseira típica, para o atalho de quantidade
 * ========================================================================== */
export const FOODS = [
  // --- proteínas ---
  { id:'frango_grelhado', nome:'Frango grelhado (peito)', kcal:165, p:31, c:0, g:3.6, f:0, porcao:120, medida:'filé', plural:'filés', frac:true },
  { id:'frango_coxa',     nome:'Frango, coxa assada',     kcal:209, p:26, c:0, g:11,  f:0, porcao:100, medida:'coxa', plural:'coxas', frac:true },
  { id:'carne_patinho',   nome:'Carne magra (patinho)',   kcal:163, p:32, c:0, g:3.5, f:0, porcao:120, medida:'bife', plural:'bifes', frac:true },
  { id:'carne_moida',     nome:'Carne moída refogada',    kcal:212, p:26, c:0, g:12,  f:0, porcao:25, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  { id:'tilapia',         nome:'Tilápia grelhada',        kcal:128, p:26, c:0, g:2.7, f:0, porcao:120, medida:'filé', plural:'filés', frac:true },
  { id:'salmao',          nome:'Salmão grelhado',         kcal:208, p:22, c:0, g:13,  f:0, porcao:120, medida:'posta', plural:'postas', frac:true },
  { id:'sardinha',        nome:'Sardinha em conserva',    kcal:208, p:24, c:0, g:12,  f:0, porcao:80, medida:'lata', plural:'latas', frac:true },
  { id:'ovo_cozido',      nome:'Ovo cozido',              kcal:146, p:13, c:1.1,g:9.5, f:0, porcao:50, medida:'unidade', plural:'unidades', frac:true },
  { id:'ovo_mexido',      nome:'Ovos mexidos',            kcal:180, p:12, c:1.5,g:14,  f:0, porcao:50, medida:'unidade', plural:'unidades', frac:true },
  { id:'clara',           nome:'Clara de ovo',            kcal:52,  p:11, c:0.7,g:0.2, f:0, porcao:33, medida:'clara', plural:'claras', frac:true },
  { id:'atum',            nome:'Atum em água',            kcal:116, p:26, c:0, g:1,   f:0, porcao:80, medida:'lata', plural:'latas', frac:true },
  { id:'tofu',            nome:'Tofu',                    kcal:76,  p:8,  c:1.9,g:4.8, f:0.3,porcao:100, medida:'fatia', plural:'fatias', frac:true },
  { id:'whey',            nome:'Whey protein (pó)',       kcal:400, p:80, c:8,  g:5,   f:0, porcao:30, medida:'scoop', plural:'scoops', frac:true },
  // --- laticínios ---
  { id:'iogurte_natural', nome:'Iogurte natural integral',kcal:61,  p:3.5,c:4.7,g:3.3, f:0, porcao:170, medida:'pote', plural:'potes', frac:true },
  { id:'iogurte_desnat',  nome:'Iogurte natural desnatado',kcal:41, p:4.1,c:5.6,g:0.2, f:0, porcao:170, medida:'pote', plural:'potes', frac:true },
  { id:'queijo_branco',   nome:'Queijo branco (minas)',   kcal:264, p:17, c:3.2,g:20,  f:0, porcao:30, medida:'fatia', plural:'fatias', frac:true },
  { id:'requeijao',       nome:'Requeijão',               kcal:257, p:9,  c:3,  g:23,  f:0, porcao:20, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  { id:'leite_integral',  nome:'Leite integral',          kcal:61,  p:3.2,c:4.7,g:3.3, f:0, porcao:200, medida:'copo', plural:'copos', frac:true },
  { id:'leite_desnat',    nome:'Leite desnatado',         kcal:35,  p:3.4,c:5,  g:0.2, f:0, porcao:200, medida:'copo', plural:'copos', frac:true },
  // --- carboidratos ---
  { id:'arroz_branco',    nome:'Arroz branco cozido',     kcal:128, p:2.5,c:28, g:0.2, f:1.6,porcao:25, medida:'colher de servir', plural:'colheres de servir', frac:true },
  { id:'arroz_integral',  nome:'Arroz integral cozido',   kcal:124, p:2.6,c:26, g:1,   f:2.7,porcao:25, medida:'colher de servir', plural:'colheres de servir', frac:true },
  { id:'feijao',          nome:'Feijão carioca cozido',   kcal:76,  p:4.8,c:14, g:0.5, f:8.5,porcao:80, medida:'concha', plural:'conchas', frac:true },
  { id:'batata_doce',     nome:'Batata-doce cozida',      kcal:77,  p:1.3,c:18, g:0.1, f:2.2,porcao:130, medida:'unidade média', plural:'unidades médias', frac:true },
  { id:'batata_inglesa',  nome:'Batata cozida',           kcal:52,  p:1.2,c:12, g:0.1, f:1.3,porcao:130, medida:'unidade média', plural:'unidades médias', frac:true },
  { id:'mandioca',        nome:'Mandioca cozida',         kcal:125, p:0.6,c:30, g:0.3, f:1.6,porcao:100, medida:'pedaço', plural:'pedaços', frac:true },
  { id:'macarrao',        nome:'Macarrão cozido',         kcal:158, p:5.8,c:30, g:0.9, f:1.8,porcao:120, medida:'pegador', plural:'pegadores', frac:true },
  { id:'pao_integral',    nome:'Pão integral',            kcal:253, p:9.4,c:44, g:3.7, f:6.9,porcao:50, medida:'fatia', plural:'fatias', frac:true },
  { id:'pao_frances',     nome:'Pão francês',             kcal:300, p:8,  c:59, g:3.1, f:2.3,porcao:50, medida:'unidade', plural:'unidades', frac:true },
  { id:'tapioca',         nome:'Tapioca (goma)',          kcal:240, p:0,  c:60, g:0,   f:0, porcao:60, medida:'unidade', plural:'unidades', frac:true },
  { id:'aveia',           nome:'Aveia em flocos',         kcal:394, p:14, c:66, g:8.5, f:9.1,porcao:10, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  { id:'quinoa',          nome:'Quinoa cozida',           kcal:120, p:4.4,c:21, g:1.9, f:2.8,porcao:25, medida:'colher de servir', plural:'colheres de servir', frac:true },
  { id:'granola',         nome:'Granola',                 kcal:434, p:9,  c:66, g:14,  f:7, porcao:15, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  // --- frutas ---
  { id:'banana',          nome:'Banana',                  kcal:92,  p:1.3,c:24, g:0.1, f:2, porcao:100, medida:'unidade', plural:'unidades', frac:true },
  { id:'maca',            nome:'Maçã',                    kcal:56,  p:0.3,c:15, g:0,   f:1.3,porcao:130, medida:'unidade', plural:'unidades', frac:true },
  { id:'laranja',         nome:'Laranja',                 kcal:37,  p:1,  c:8.9,g:0.1, f:0.8,porcao:180, medida:'unidade', plural:'unidades', frac:true },
  { id:'mamao',          nome:'Mamão',                   kcal:40,  p:0.5,c:10, g:0.1, f:1.8,porcao:150, medida:'fatia', plural:'fatias', frac:true },
  { id:'morango',         nome:'Morango',                 kcal:30,  p:0.9,c:6.8,g:0.3, f:1.7,porcao:12, medida:'unidade', plural:'unidades', frac:false },
  { id:'abacate',         nome:'Abacate',                 kcal:96,  p:1.2,c:6,  g:8.4, f:6.3,porcao:100, medida:'metade', plural:'metades', frac:true },
  { id:'melancia',        nome:'Melancia',                kcal:33,  p:0.9,c:8.1,g:0,   f:0.1,porcao:200, medida:'fatia', plural:'fatias', frac:true },
  { id:'uva',             nome:'Uva',                     kcal:53,  p:0.7,c:14, g:0.2, f:0.9,porcao:100, medida:'cacho pequeno', plural:'cachos pequenos', frac:true },
  // --- vegetais ---
  { id:'alface',          nome:'Alface',                  kcal:15,  p:1.4,c:2.4,g:0.2, f:2.3,porcao:50, medida:'prato', plural:'pratos', frac:true },
  { id:'tomate',          nome:'Tomate',                  kcal:15,  p:1.1,c:3.1,g:0.2, f:1.2,porcao:100, medida:'unidade', plural:'unidades', frac:true },
  { id:'brocolis',        nome:'Brócolis cozido',         kcal:25,  p:2.1,c:4.4,g:0.5, f:3.4,porcao:100, medida:'xícara', plural:'xícaras', frac:true },
  { id:'cenoura',         nome:'Cenoura crua',            kcal:34,  p:1.3,c:7.7,g:0.2, f:3.2,porcao:80, medida:'unidade', plural:'unidades', frac:true },
  { id:'abobrinha',       nome:'Abobrinha refogada',      kcal:26,  p:1.1,c:3.4,g:1.2, f:1.6,porcao:100, medida:'xícara', plural:'xícaras', frac:true },
  { id:'pepino',          nome:'Pepino',                  kcal:10,  p:0.9,c:2,  g:0.1, f:1.1,porcao:100, medida:'metade', plural:'metades', frac:true },
  { id:'couve',           nome:'Couve refogada',          kcal:90,  p:1.7,c:5.8,g:6.6, f:3.1,porcao:30, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  { id:'beterraba',       nome:'Beterraba cozida',        kcal:32,  p:1.3,c:7.2,g:0.1, f:1.9,porcao:27, medida:'fatia', plural:'fatias', frac:false },
  // --- gorduras e oleaginosas ---
  { id:'azeite',          nome:'Azeite de oliva',         kcal:884, p:0,  c:0,  g:100, f:0, porcao:8, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  { id:'castanha_para',   nome:'Castanha-do-pará',        kcal:643, p:14, c:15, g:63,  f:7.9,porcao:5, medida:'unidade', plural:'unidades', frac:false },
  { id:'castanha_caju',   nome:'Castanha de caju',        kcal:570, p:18, c:29, g:46,  f:3.7,porcao:20, medida:'punhado', plural:'punhados', frac:true },
  { id:'amendoim',        nome:'Amendoim',                kcal:544, p:27, c:20, g:44,  f:8, porcao:20, medida:'punhado', plural:'punhados', frac:true },
  { id:'pasta_amendoim',  nome:'Pasta de amendoim',       kcal:588, p:25, c:20, g:50,  f:6, porcao:20, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  // --- diversos ---
  { id:'cafe',            nome:'Café sem açúcar',         kcal:2,   p:0.1,c:0.3,g:0,   f:0, porcao:200, medida:'xícara', plural:'xícaras', frac:true },
  { id:'homus',           nome:'Homus',                   kcal:166, p:7.9,c:14, g:9.6, f:6, porcao:20, medida:'colher de sopa', plural:'colheres de sopa', frac:true },
  { id:'grao_bico',       nome:'Grão-de-bico cozido',     kcal:164, p:8.9,c:27, g:2.6, f:7.6,porcao:80, medida:'concha', plural:'conchas', frac:true },
  { id:'lentilha',        nome:'Lentilha cozida',         kcal:116, p:9,  c:20, g:0.4, f:7.9,porcao:80, medida:'concha', plural:'conchas', frac:true },
  { id:'chocolate70',     nome:'Chocolate 70% cacau',     kcal:579, p:7.8,c:46, g:41,  f:11, porcao:10, medida:'quadradinho', plural:'quadradinhos', frac:false }
];

/** Busca por nome, sem acento e sem diferenciar maiúsculas. */
const semAcento = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function buscarAlimentos(termo, limite = 12) {
  const q = semAcento(String(termo || '').trim());
  if (!q) return [];
  return FOODS
    .map(f => ({ f, i: semAcento(f.nome).indexOf(q) }))
    .filter(x => x.i >= 0)
    .sort((a, b) => a.i - b.i || a.f.nome.localeCompare(b.f.nome))
    .slice(0, limite)
    .map(x => x.f);
}

/* ---------------------------------------------------------------- quantidade
 * A usuária pensa em "3 ovos" ou "1,5 concha de feijão", não em gramas.
 * `porcao` é o peso de UMA medida caseira; a quantidade multiplica esse peso.
 * -------------------------------------------------------------------------- */

/** Passo do seletor: meia unidade quando a medida comporta. */
export const passoDe = food => (food.frac ? 0.5 : 1);

/** Formata 1 → "1", 1.5 → "1,5" (padrão brasileiro). */
export const formatarQtd = q =>
  Number.isInteger(Number(q)) ? String(Number(q)) : String(Number(q)).replace('.', ',');

/** "3 unidades", "1,5 concha", "4 colheres de servir". */
export function descreverMedida(food, qtd) {
  const n = Number(qtd) || 0;
  // Em português, valores até 1 ficam no singular: "0,5 unidade", "1 concha".
  // Acima de 1 vão para o plural: "1,5 conchas", "3 unidades".
  const nome = n > 1 ? food.plural : food.medida;
  return `${formatarQtd(n)} ${nome}`;
}

/** Texto que vai para o diário: "3 unidades · Ovo cozido". */
export const descreverItem = (food, qtd) =>
  `${descreverMedida(food, qtd)} · ${food.nome}`;

/** Gramas correspondentes a uma quantidade de medidas caseiras. */
export const gramasDe = (food, qtd) =>
  Math.round((Number(qtd) || 0) * food.porcao);

/** Macros a partir da QUANTIDADE de medidas caseiras (não de gramas). */
export function calcularPorQuantidade(food, qtd) {
  return { ...calcular(food, gramasDe(food, qtd)), gramas: gramasDe(food, qtd), qtd: Number(qtd) || 0 };
}

/** Macros de uma quantidade em gramas. */
export function calcular(food, gramas) {
  const k = (Number(gramas) || 0) / 100;
  return {
    kcal: Math.round(food.kcal * k),
    p: +(food.p * k).toFixed(1),
    c: +(food.c * k).toFixed(1),
    g: +(food.g * k).toFixed(1),
    f: +(food.f * k).toFixed(1)
  };
}

/** Soma os macros de uma lista de itens já calculados. */
export function somar(itens) {
  return itens.reduce((t, i) => ({
    kcal: t.kcal + (i.kcal || 0),
    p: +(t.p + (i.p || 0)).toFixed(1),
    c: +(t.c + (i.c || 0)).toFixed(1),
    g: +(t.g + (i.g || 0)).toFixed(1),
    f: +(t.f + (i.f || 0)).toFixed(1)
  }), { kcal: 0, p: 0, c: 0, g: 0, f: 0 });
}
