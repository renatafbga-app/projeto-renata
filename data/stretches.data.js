/* ============================================================================
 * BIBLIOTECA DE ALONGAMENTOS
 *
 * Todo alongamento citado em qualquer treino existe aqui, com ficha completa.
 * A integridade dessa referência é verificada por teste automatizado: nenhum
 * dia do programa pode apontar para uma chave inexistente.
 *
 * Mesma estrutura de campos dos exercícios, para que a tela de ficha e a
 * Biblioteca usem exatamente o mesmo padrão visual.
 * ========================================================================== */

export const STRETCHES = [
  {
    key: 'st_quad', id: 'al01', no: 1,
    nome: 'Alongamento de Quadríceps',
    curto: 'Quadríceps',
    regiao: 'Frente da coxa',
    musculos: 'Reto femoral, vastos lateral, medial e intermédio',
    objetivo: 'Soltar a frente da coxa depois de agachamentos, afundos e cadeira na parede. ' +
              'Quadríceps encurtado puxa a patela para cima e aumenta a pressão dentro do joelho.',
    tempo: '30 segundos em cada perna',
    execucao: [
      'Fique em pé e apoie uma das mãos na parede ou numa cadeira firme.',
      'Dobre um joelho e segure o tornozelo (não o pé) com a mão do mesmo lado.',
      'Puxe o calcanhar em direção ao glúteo, sem forçar a articulação.',
      'Mantenha os dois joelhos lado a lado e o quadril levemente à frente.',
      'Contraia o glúteo do lado alongado para aprofundar sem puxar mais forte.',
      'Segure a posição e troque de perna.'
    ],
    respiracao: 'Respire devagar pelo nariz e solte o ar pela boca, sem prender a respiração.',
    erros: [
      'Puxar o pé em vez do tornozelo, torcendo o joelho.',
      'Afastar o joelho alongado para o lado, tirando a tensão do músculo.',
      'Arquear a lombar em vez de levar o quadril à frente.',
      'Balançar o corpo para tentar aumentar o alongamento.'
    ],
    cuidados: 'Se sentir pressão dentro do joelho, diminua a puxada. O alongamento deve ' +
              'repuxar a coxa, nunca doer na articulação.',
    evitar: 'Evite se houver dor aguda no joelho no dia, inchaço visível ou logo após uma ' +
            'crise da pata de ganso. Nesses dias, prefira o alongamento de posterior, que é mais suave.',
    observacoes: 'Sem equilíbrio? Faça deitada de lado, puxando o tornozelo de cima. ' +
                 'O efeito é o mesmo e a estabilidade é bem maior.'
  },
  {
    key: 'st_hamstring', id: 'al02', no: 2,
    nome: 'Alongamento de Posterior de Coxa',
    curto: 'Posterior de Coxa',
    regiao: 'Atrás da coxa',
    musculos: 'Bíceps femoral, semitendíneo, semimembranáceo',
    objetivo: 'Alongar a cadeia posterior depois de stiff, levantamento terra e elevação ' +
              'pélvica. Dois dos tendões desta região formam a pata de ganso — cuidar deles ' +
              'é cuidar diretamente do seu joelho.',
    tempo: '30 segundos, ou 30 segundos em cada perna na versão unilateral',
    execucao: [
      'Em pé, pés na largura do quadril e joelhos levemente soltos.',
      'Empurre o quadril para trás e incline o tronco à frente, mantendo as costas retas.',
      'Desça até sentir repuxar atrás das coxas, sem arredondar a coluna.',
      'Deixe os braços pendurados e relaxe o pescoço.',
      'Para a versão unilateral, apoie um calcanhar num degrau baixo e incline o tronco.',
      'Volte devagar, subindo pela força do quadril.'
    ],
    respiracao: 'Expire ao descer e continue respirando de forma contínua na posição.',
    erros: [
      'Arredondar a lombar em vez de dobrar pelo quadril.',
      'Travar completamente os joelhos.',
      'Forçar até doer atrás do joelho.',
      'Dar impulsos para descer mais.'
    ],
    cuidados: 'Sensação de repuxar atrás da coxa é o esperado. Formigamento ou choque descendo ' +
              'pela perna não é alongamento — pare e procure orientação.',
    evitar: 'Evite a versão em pé se tiver dor lombar no dia. Nesse caso, faça deitada, ' +
            'com a perna apoiada numa faixa ou toalha.',
    observacoes: 'É o alongamento mais importante do seu programa. Se um dia só der tempo ' +
                 'para um, faça este.'
  },
  {
    key: 'st_calf', id: 'al03', no: 3,
    nome: 'Alongamento de Panturrilha',
    curto: 'Panturrilha',
    regiao: 'Parte de trás da perna',
    musculos: 'Gastrocnêmio e sóleo',
    objetivo: 'Liberar a panturrilha depois da esteira e das elevações. Panturrilha rígida ' +
              'limita o tornozelo e faz o joelho compensar no agachamento.',
    tempo: '30 segundos em cada perna',
    execucao: [
      'Fique de frente para a parede, com as mãos apoiadas na altura do peito.',
      'Leve uma perna bem para trás, mantendo o joelho estendido.',
      'Mantenha o calcanhar de trás firme no chão e as pontas dos pés para frente.',
      'Empurre o quadril à frente até sentir repuxar a panturrilha de trás.',
      'Para alcançar o sóleo, repita dobrando levemente o joelho de trás.',
      'Troque de perna.'
    ],
    respiracao: 'Respiração contínua e tranquila durante toda a posição.',
    erros: [
      'Levantar o calcanhar de trás do chão, o que anula o alongamento.',
      'Girar o pé de trás para fora.',
      'Curvar as costas em vez de levar o quadril à frente.',
      'Fazer só com o joelho estendido e esquecer a versão com joelho dobrado.'
    ],
    cuidados: 'Faça sempre com o pé apontando para frente. Pé girado transfere a tensão ' +
              'para a parte interna do joelho.',
    evitar: 'Evite se houver dor aguda no tendão de Aquiles ou inchaço no tornozelo.',
    observacoes: 'As duas versões — joelho estendido e joelho dobrado — trabalham músculos ' +
                 'diferentes. Fazer as duas leva um minuto e vale muito a pena.'
  },
  {
    key: 'st_glute', id: 'al04', no: 4,
    nome: 'Alongamento de Glúteos',
    curto: 'Glúteos',
    regiao: 'Quadril e nádegas',
    musculos: 'Glúteo máximo, glúteo médio e piriforme',
    objetivo: 'Relaxar o quadril depois de elevação pélvica, agachamento e caminhada lateral. ' +
              'Glúteo tenso limita a mobilidade do quadril e joga trabalho extra para a lombar.',
    tempo: '30 segundos em cada lado',
    execucao: [
      'Deite de costas com os dois joelhos dobrados e os pés no chão.',
      'Cruze o tornozelo direito sobre o joelho esquerdo, formando um quatro.',
      'Passe as mãos por trás da coxa esquerda e puxe-a em direção ao peito.',
      'Mantenha a cabeça e os ombros apoiados no chão.',
      'Empurre suavemente o joelho direito para longe com o cotovelo, se quiser mais intensidade.',
      'Solte devagar e troque de lado.'
    ],
    respiracao: 'Inspire preparando e expire enquanto puxa a coxa, deixando o quadril soltar.',
    erros: [
      'Levantar a cabeça e os ombros do chão, tensionando o pescoço.',
      'Puxar pela canela em vez da coxa, forçando o joelho.',
      'Prender a respiração.',
      'Puxar rápido em vez de manter a posição.'
    ],
    cuidados: 'Puxe sempre por trás da coxa. Puxar pela canela transfere a força para a ' +
              'articulação do joelho, que é justamente o que queremos proteger.',
    evitar: 'Evite se houver dor aguda no quadril ou desconforto na região da virilha.',
    observacoes: 'Pode ser feito sentada numa cadeira, cruzando o tornozelo sobre o joelho e ' +
                 'inclinando o tronco à frente. Útil para fazer no meio do dia.'
  },
  {
    key: 'st_lower_back', id: 'al05', no: 5,
    nome: 'Alongamento de Lombar',
    curto: 'Lombar',
    regiao: 'Parte baixa das costas',
    musculos: 'Eretores da espinha, quadrado lombar',
    objetivo: 'Descomprimir a lombar depois de terra, stiff, remada e good morning. ' +
              'Fecha o treino trazendo o corpo para um estado de relaxamento.',
    tempo: '30 segundos, podendo repetir duas vezes',
    execucao: [
      'Deite de costas numa superfície confortável.',
      'Traga os dois joelhos em direção ao peito.',
      'Abrace as pernas por trás das coxas, sem prender as canelas.',
      'Deixe a lombar afundar no chão e os ombros relaxados.',
      'Balance suavemente de um lado para o outro, se for confortável.',
      'Solte as pernas devagar, uma de cada vez.'
    ],
    respiracao: 'Respire fundo pelo abdômen. A cada expiração, deixe o corpo afundar um pouco mais.',
    erros: [
      'Puxar os joelhos com força em vez de deixar o peso fazer o trabalho.',
      'Levantar a cabeça em direção aos joelhos.',
      'Segurar pelas canelas, comprimindo os joelhos.',
      'Fazer movimentos bruscos de balanço.'
    ],
    cuidados: 'Este é um alongamento de relaxamento, não de força. Se sentir qualquer dor ' +
              'irradiando para a perna, pare imediatamente.',
    evitar: 'Evite em caso de dor lombar aguda, hérnia de disco em crise ou logo após lesão. ' +
            'Nesses casos, procure seu fisioterapeuta antes.',
    observacoes: 'Bom para fazer também antes de dormir. Ajuda a soltar a tensão acumulada no dia.'
  },
  {
    key: 'st_chest', id: 'al06', no: 6,
    nome: 'Alongamento de Peitoral',
    curto: 'Peitoral',
    regiao: 'Peito e frente dos ombros',
    musculos: 'Peitoral maior e menor, deltoide anterior',
    objetivo: 'Abrir o peito depois de supino e flexões. É o alongamento que mais contribui ' +
              'para a melhora de postura, um dos seus objetivos no programa.',
    tempo: '30 segundos em cada lado',
    execucao: [
      'Fique de lado para uma parede ou batente de porta.',
      'Apoie o antebraço na superfície, com o cotovelo na altura do ombro.',
      'Mantenha o antebraço firme e gire o tronco lentamente para o lado oposto.',
      'Dê um passo à frente com a perna do mesmo lado, se quiser mais intensidade.',
      'Mantenha os ombros baixos, longe das orelhas.',
      'Solte devagar e troque de lado.'
    ],
    respiracao: 'Inspire abrindo o peito e expire aprofundando suavemente a rotação.',
    erros: [
      'Levantar o cotovelo acima da linha do ombro, comprimindo a articulação.',
      'Girar rápido demais.',
      'Encolher os ombros durante o alongamento.',
      'Arquear a lombar em vez de girar pelo tronco.'
    ],
    cuidados: 'Se sentir formigamento descendo pelo braço, reduza a amplitude imediatamente. ' +
              'Isso indica compressão nervosa, não alongamento.',
    evitar: 'Evite em caso de dor no ombro, lesão no manguito rotador ou instabilidade articular.',
    observacoes: 'Se você passa muitas horas no computador ou no celular, este alongamento ' +
                 'faz diferença mesmo fora dos dias de treino.'
  },
  {
    key: 'st_shoulders', id: 'al07', no: 7,
    nome: 'Alongamento de Ombros',
    curto: 'Ombros',
    regiao: 'Ombros e parte alta das costas',
    musculos: 'Deltoide posterior, romboides, trapézio',
    objetivo: 'Soltar os ombros depois de remada, barra fixa e desenvolvimento. ' +
              'Alivia a tensão que se acumula na parte de cima das costas.',
    tempo: '30 segundos em cada braço',
    execucao: [
      'Fique em pé ou sentada, com a coluna alinhada.',
      'Estenda um braço à frente do peito, na horizontal.',
      'Com a outra mão, segure logo acima do cotovelo do braço estendido.',
      'Puxe o braço em direção ao peito, mantendo-o estendido.',
      'Mantenha o ombro baixo, sem encolher em direção à orelha.',
      'Solte e troque de braço.'
    ],
    respiracao: 'Respiração contínua e relaxada, sem prender o ar.',
    erros: [
      'Segurar na articulação do cotovelo em vez de acima dela.',
      'Encolher o ombro durante a puxada.',
      'Girar o tronco para acompanhar o braço.',
      'Dobrar o braço que está sendo alongado.'
    ],
    cuidados: 'Puxe sempre acima do cotovelo. Puxar na articulação gera tensão indevida ' +
              'no próprio cotovelo.',
    evitar: 'Evite se houver dor no ombro ao elevar o braço, ou logo após uma lesão na região.',
    observacoes: 'Combine com o alongamento de peitoral para um efeito completo na postura ' +
                 'da parte superior do corpo.'
  }
];

/** Aquecimentos do livro. */
export const WARMUPS = [
  { nome: 'Aquecimento A — Circulação (5 min)', itens: [
    'Esteira em caminhada leve 3–4 km/h — 3 min',
    'Marcha estacionária elevando os joelhos — 30 s',
    'Círculos de braço para frente e para trás — 30 s',
    'Círculos de quadril para os dois lados — 1 min' ] },
  { nome: 'Aquecimento B — Ativação de Glúteos (6 min)', itens: [
    'Esteira em caminhada leve — 2 min',
    'Caminhada lateral com elástico — 30 s cada lado',
    'Elevação pélvica no solo (leve) — 15 repetições',
    'Abdução de quadril com elástico — 12 cada lado',
    'Agachamento livre sem carga — 12 repetições' ] },
  { nome: 'Aquecimento C — Mobilidade Geral (6 min)', itens: [
    'Esteira em caminhada leve — 2 min',
    'Círculos de quadril e tornozelo — 1 min',
    'Bom-dia sem carga (dobradiça de quadril) — 12 rep',
    'Marcha com elevação de joelho — 40 s',
    'Rotação de tronco em pé — 40 s' ] }
];

/** Sequência padrão do alongamento final, na ordem de execução. */
export const ROTINA_FINAL = STRETCHES.map(s => s.key);

export const acharAlongamento = idOuKey =>
  STRETCHES.find(s => s.id === idOuKey || s.key === idOuKey) || null;
