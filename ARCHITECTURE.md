# Arquitetura — Projeto Renata

Documento de manutenção. Explica **por que** o código é assim, não só o que ele faz.

---

## 1. Princípio central: app descartável, dados sagrados

O sistema tem duas metades que **nunca se misturam**:

| | Onde vive | Quem mexe | Some numa atualização? |
|---|---|---|---|
| **Aplicação** | `index.html`, `css/`, `js/`, `data/`, `icons/` | Service Worker (Cache Storage) | **Sim** — e tudo bem |
| **Dados da usuária** | IndexedDB `projeto-renata-user` + `localStorage` com prefixo `pr.user.` | Apenas `js/core/store.js` | **Nunca** |

O Service Worker só manipula Cache Storage. Ele não tem uma linha sequer que
toque IndexedDB ou localStorage. É isso que garante o requisito de que
atualizações futuras jamais apaguem treinos, cargas ou histórico.

**Para publicar uma versão nova:** troque `CACHE_VERSION` em `service-worker.js`.
Caches velhos são apagados, dados permanecem.

---

## 2. Camadas

```
Shell (index.html)         estrutura visual fixa
   └─ Router (router.js)   hash routing → view
        └─ Views           15 telas, só renderizam e escutam eventos
             └─ Store      porta ÚNICA de dados
                  └─ DB    wrapper IndexedDB
```

**Regra inviolável:** nenhuma view chama `localStorage` ou `indexedDB`
diretamente. Se uma view precisar de dados novos, adicione um método ao store.

Por que isso importa: backup, importação, troca de perfil e a futura
sincronização em nuvem enxergam 100% dos dados **por construção**. Não existe
o risco clássico de "esqueci de incluir tal campo no backup".

Exceção consciente e documentada: `views/exercise.js` grava a observação livre
do exercício em `localStorage` sob o prefixo `pr.user.exnote.*`. Como respeita o
prefixo, o backup continua capturando.

---

## 3. Modelo de dados

### IndexedDB (`js/core/schema.js`)

| Store | Chave | Guarda |
|---|---|---|
| `workouts` | `${perfil}:${dia}` | Um registro por dia executado: séries, notas, check-in |
| `sets` | auto | Log achatado de séries — alimenta a progressão de carga |
| `daily` | `${perfil}:${tipo}:${data}` | Tudo que é "um valor por dia" |
| `journal` | auto | Entradas livres do diário |
| `photos` | `${perfil}:${data}` | Evolução por fotos: 4 ângulos em data URL |
| `foods` | `${perfil}:${alimento}` | Alimentos próprios, edições e remoções |
| `meta` | `key` | Versão de schema, migrações aplicadas |

**Decisão:** unificamos peso, medidas, água, refeições, sono, humor e joelho num
único store `daily`, diferenciados pelo campo `kind`. Sete stores separados
gerariam sete vezes o mesmo código de CRUD. Adicionar um novo tipo de
acompanhamento amanhã custa uma linha em `DAILY_KINDS`.

**Decisão (v1.4):** as fotos são guardadas como **data URL** e não como Blob.
São comprimidas no aparelho (lado maior 1280 px, JPEG 0.72 → ~150 KB) antes de
gravar. Data URL entra no backup JSON sem conversão e sobrevive a exportar e
importar; Blob exigiria serialização especial em cada caminho.

**Decisão:** chaves compostas em string (`default:water:2026-07-19`) em vez de
índices complexos. Leitura e escrita ficam determinísticas e o código do `db.js`
cabe em 90 linhas.

### localStorage (prefixo `pr.user.`)

Só o que é pequeno e precisa de leitura **síncrona**: configurações, progresso
do programa, perfis, lembretes já disparados hoje. Se estivesse no IndexedDB,
toda tela precisaria de `await` só para saber qual tema aplicar.

---

## 4. Migrações — por que nada quebra

`onupgradeneeded` é **estritamente aditivo**: cria stores e índices que faltam,
nunca remove. Não existe `deleteObjectStore` no código.

Para mudanças de formato de dados, use `MIGRATIONS` em `schema.js`:

```js
export const MIGRATIONS = [
  { id: '2026-08-agua-em-ml', run: async (db) => { /* converte e regrava */ } }
];
```

Cada migração roda no máximo uma vez e fica registrada no store `meta`.

Configurações usam **merge com os padrões** na leitura: uma chave nova numa
versão futura aparece sozinha, sem apagar o que a usuária já escolheu.

---

## 5. Ciclo de vida das telas (auditoria 4.5)

Cada `render()` cria um `AbortController`. Ao navegar, o router aborta o
anterior e **todos** os listeners registrados com `{ signal }` desaparecem
juntos. O `mount(root, params, ctx)` recebe `ctx.signal`.

Por que existe: antes, `bindAutosave` registrava listeners de `window` e
`document` com `{ once: true }` a cada tela montada. Como `once` só limpa
*depois* de disparar, uma sessão de uso normal — dezenas de navegações —
acumulava listeners presos a nós de DOM já descartados. Era um vazamento de
memória real, invisível em teste curto e sensível ao longo de 90 dias de uso.

`refresh()` redesenha a tela atual sem reiniciar o app. As telas usavam
`location.reload()` após salvar ou apagar, o que reabria o IndexedDB e mostrava
o splash de novo.

---

## 5b. Incidente v1.3.0 — a camada invisível

**Sintoma em produção:** o app abria, o layout aparecia corretamente, e nenhum
toque funcionava. A URL nunca mudava.

**Causa:** `<div id="sheetLayer" class="sheet-layer" hidden>` no HTML, e no CSS
`.sheet-layer { position: fixed; inset: 0; z-index: 120; display: flex }`.

O atributo `hidden` é implementado pela folha do **navegador** como
`[hidden] { display: none }`. Qualquer regra de **autor** que defina `display`
vence na cascata. O elemento continuava renderizado: uma camada transparente,
sem fundo próprio, cobrindo a tela inteira acima da tab bar (z-index 70).
Tudo era desenhado; nada era tocável.

**Correção:** `[hidden] { display: none !important }` em `base.css` — fecha a
classe inteira do problema. Como defesa em profundidade,
`.sheet-layer:empty { pointer-events: none }`.

**Por que os 70 testes não pegaram:** todos rodavam em Node com um DOM
simulado. Nenhum montava a cascata CSS, calculava layout ou testava acerto de
toque. A cobertura era de lógica; o defeito era de renderização.

**O que mudou no processo:** `tools/audit-dom.mjs` analisa o `index.html` real
contra o CSS real. Oito testes novos verificam a guarda `[hidden]`, conflitos
de `display` em elementos escondidos, camadas de tela cheia sem forma de sair
do caminho, ordem de z-index e a integridade do vigia de inicialização.

Também foi adicionado um **vigia de boot** em `index.html` — script clássico,
não módulo, porque um módulo que falha não executa. Se o app não sinalizar
`window.__PR_BOOTED` em 8 segundos, ele esconde o splash e mostra os erros
capturados. Num telefone não existe console de desenvolvedor.

---

## 5c. Incidente v1.4.0 — o rótulo colado

**Sintoma:** títulos de aviso grudados no texto — "Seu momentoA hidratação…",
"Atenção ao joelhoFortalece…".

**Causa:** regressão introduzida pela própria auditoria 4.5. Ao remover o bloco
`.prose` "duplicado" do `views.css`, o recorte ia de `.prose {` até `.figure {`
— e levou junto as regras `.callout`, que ficavam entre os dois. Sem
`display: block` no `<span class="t">`, o rótulo virava texto corrido.

**Correção:** componente `.callout` restaurado em `components.css`, agora como
componente compartilhado (é usado tanto nas telas quanto no livro).

**O que mudou no processo:** `tools/audit-textos.mjs` renderiza todas as telas e
capítulos, extrai o **texto visível** e procura palavras coladas. Ele lê o CSS
para saber quais `<span>` são bloco — sem isso acusaria falso positivo onde o
CSS já resolve, e deixaria passar o caso real. Um segundo teste garante que
nenhuma classe usada no markup fique sem regra CSS, que foi como o defeito
nasceu.

---

## 5d. Integridade referencial dos alongamentos (v1.4.1)

Até a v1.4.0 a lista de alongamentos ao final do treino era **texto escrito à
mão** dentro das telas: `"Quadríceps, Posterior, Panturrilha…"`. Não havia como
verificar se um alongamento citado existia de fato — nem existia ficha alguma.

Agora `data/program.data.js` guarda, em cada dia, o campo `stretches` com as
**chaves** das fichas em `data/stretches.data.js`. Isso transforma a promessa
"nenhum treino aponta para alongamento inexistente" numa invariante testável,
e não numa boa intenção.

Dois testes protegem isso: um verifica que toda chave citada tem ficha, outro
verifica que nenhuma tela voltou a escrever a lista à mão.

**O que isso já pegou:** ao converter as telas, minha substituição no
`workout-day.js` falhou em silêncio (o padrão de busca dizia "Posterior de Coxa"
e o arquivo tinha "Posterior"). O `session.js` foi convertido, o `workout-day.js`
não — e só o teste percebeu.

---

## 5e. Incidente v1.4.2 — a navegação que voltava para a Home

**Sintoma:** na v1.4.1, tocar em qualquer caminho para os alongamentos
(Biblioteca, "Ver todos", "Ver como fazer") levava de volta à tela inicial.

**O roteamento estava correto.** Verifiquei as cinco rotas isoladamente: todas
resolvem, com os parâmetros certos. O código publicado não era o código em
execução — o aparelho servia arquivos antigos.

**Causa raiz (três defeitos somados):**

1. `caches.match(req)` sem informar o cache **procura em todos os caches da
   origem**, inclusive nos antigos. Bastava um cache anterior sobreviver para o
   `app.js` da versão passada voltar a ser servido — sem as rotas novas.
2. O router mandava rotas desconhecidas para a Home **em silêncio**
   (`if (!match) { go('/'); return; }`). O defeito ficava invisível: parecia um
   botão que "volta para o início", não um erro.
3. A instalação do Service Worker engolia falhas individuais, podendo ativar um
   cache pela metade como se estivesse completo.

**Correções:**

- Consulta escopada: `cache.match()` no cache da versão atual, nunca global.
- **Stale-while-revalidate**: responde do cache e atualiza em segundo plano.
  Uma correção publicada passa a valer na abertura seguinte.
- Instalação aborta se um arquivo essencial falhar — melhor manter a versão
  antiga funcionando do que ativar uma quebrada.
- Rota desconhecida mostra tela de erro com o endereço tentado e atalho para
  Configurações.
- Configurações mostra a **versão em execução** (app × cache) e tem
  **Forçar atualização**, que limpa caches e desregistra o Service Worker sem
  tocar nos dados.

**O que mudou no processo:** `tools/audit-rotas.mjs` extrai todas as rotas do
`app.js` e todos os links das telas, e verifica se cada link resolve. Um link
para rota inexistente deixou de ser invisível.

Validei por reversão: removendo as rotas de alongamento, a auditoria acusa os
12 links quebrados exatamente nos fluxos reportados.

---

## 5f. Base alimentar em duas camadas (v1.5.0)

O catálogo (`data/foods.data.js`, 260 itens em 11 categorias) é **conteúdo do
app**: estático, gerado por script, cacheado pelo Service Worker. O store
`foods` guarda apenas as **diferenças** da usuária — alimentos que ela criou,
edições sobre itens do catálogo e marcações de remoção.

`js/core/foods.js` mescla as duas camadas na leitura. Consequências:

- o catálogo pode crescer para milhares de itens numa atualização sem tocar nos
  dados da usuária;
- o que ela criou sobrevive a qualquer atualização, porque vive do outro lado da
  fronteira app/dados;
- editar um item do catálogo não muta o arquivo estático — grava uma diferença,
  e "restaurar" simplesmente apaga essa diferença.

Favoritos e recentes ficam em `localStorage` com o prefixo `pr.user.`, então
entram no backup como todo o resto.

**Sobre o tamanho da base:** 260 itens conferidos valem mais que milhares
gerados sem fonte. Valores nutricionais errados num app de saúde são pior que
ausência de dados. A importação (`importarAlimentos`) existe justamente para
crescer com dados de procedência conhecida.

---

## 5g. Fonte única do peso (v1.5.0)

Peso, Medidas e Evolução por Fotos gravam no **mesmo** registro `daily/weight`.

Antes, as Fotos guardavam o peso dentro do próprio registro fotográfico. Duas
fontes de verdade para o mesmo fato: o card "Último peso" aparecia vazio mesmo
com peso lançado no módulo Peso, e a mesma data podia ter dois valores.

Agora `savePhotoSession` extrai o peso do patch e grava em `daily/weight`;
`listPhotoSessions` faz o join na leitura. Não existe cópia para divergir.

---

## 5h. Datas locais e navegação entre dias (v1.6.0)

**Bug corrigido:** o app "virava o dia" às 21h. A causa era
`new Date().toISOString().slice(0,10)`, que converte para **UTC** antes de
cortar. No Brasil (UTC−3), das 21h à meia-noite o UTC já está no dia seguinte.

`js/core/dates.js` é a fonte única de datas. Tudo é calculado no horário local:
o dia só muda à meia-noite local. Um teste simula 21h30 em Brasília e prova que
o dia permanece correto.

**Data ativa.** O mesmo módulo mantém a data de trabalho do app, observável.
`store.dataDeTrabalho()` a expõe às views; o seletor global (◀ Hoje ▶ na navbar)
a altera; ao mudar, o router redesenha a tela ativa e todos os módulos de
registro diário passam a ler e gravar naquela data. Não existe mais "sempre
hoje" — você registra a água esquecida de ontem normalmente.

Os campos de data internos das telas foram removidos: a data vem de um lugar só.

---

## 5i. Base alimentar em duas camadas, ampliada (v1.6.0)

383 alimentos, 11 categorias, com sódio e açúcar. 21 com marca (Ninho, Nescau,
Piracanjuba, Danone, Sadia…) e 35 com sinônimos regionais. A busca casa nome,
marca, sinônimo e categoria: "aipim" e "macaxeira" encontram mandioca.

Refeições favoritas ("Meu café da manhã") são combinações salvas em
`localStorage` sob `pr.user.`, adicionadas com um toque, e entram no backup.

Vale repetir a decisão da v1.5.0: **não inventamos valores nutricionais.** Os
383 itens têm referência de tabelas oficiais e rótulos. A base cresce por
importação com procedência ou cadastro próprio, nunca por preenchimento
artificial.

---

## 6. Autosave

Não há botão "Salvar" em lugar nenhum — é o padrão do iOS.

`js/core/autosave.js` liga qualquer campo marcado com `data-save="campo"` a uma
função de gravação, com debounce de 450 ms. Além disso, força a gravação em:

- `blur` do campo
- `pagehide` (usuária fecha ou troca de app)
- `visibilitychange` para oculto (minimizou)

Um selo discreto "Salvo" confirma. A tela de sessão de treino tem sua própria
rotina de persistência porque salva uma estrutura aninhada (exercícios × séries).

---

## 7. Progressão de carga e a regra do joelho

`store.loadStats(exKey)` devolve última carga, maior, média, histórico e
**sugestão para hoje**.

A sugestão sobe 1–2 kg **somente se**:
1. todas as séries do último treino daquele exercício foram concluídas, **e**
2. o check-in daquele treino registrou dor no joelho **menor que 4**.

Esta trava não é enfeite: é a regra do livro virada código. A usuária tem
inflamação na pata de ganso, e progressão de carga com articulação inflamada é
exatamente o caminho da lesão. O app não deixa isso acontecer por esquecimento.

---

## 8. Notificações — limitação real, documentada

No iPhone, um PWA **sem servidor de push não consegue notificar com o app
fechado**. O iOS só entrega Web Push (16.4+) para apps instalados na tela
inicial e a partir de um backend. Não existe agendamento local.

O que foi implementado:

1. Notificação nativa quando o app está aberto e o horário chega.
2. Lembretes internos: ao abrir, o app mostra o que ficou pendente hoje.
3. Marcação de "já avisei" por dia, para não repetir.
4. Cancelamento automático dos lembretes de treino ao concluir o dia.
5. `subscribePush()` pronto para quando houver backend com VAPID.

---

## 9. Pontos de extensão (`js/core/adapters.js`)

Todos seguem o mesmo contrato — `isAvailable / connect / push / pull` — e
trafegam o **mesmo formato do backup**, que é a moeda universal de dados.

| Adaptador | Estado hoje | O que falta |
|---|---|---|
| `AppleHealth` | Exporta peso em CSV (funciona) | Ponte nativa WKWebView para HealthKit |
| `AppleWatch` | Interface definida | App nativo companheiro |
| `CloudSync` | Lógica pronta | Injetar `transport` (fetch/iCloud/Supabase) |
| `AI` | Heurística local offline | Injetar `provider` com chamada de API |
| `Profiles` | **Funciona** | Só falta interface para criar/trocar |

Integrar significa **plugar um adaptador**, não reescrever o app. O store já é
multi-perfil: todo registro carrega o campo `profile`.

---

## 10. Decisões de UX alinhadas ao iPhone

- **Tab bar com 5 itens** + tela "Mais" — o iOS não comporta 15 abas.
- **Sem botão Salvar** — apps nativos guardam sozinhos.
- **Título grande que encolhe no scroll** — padrão `UINavigationController`.
- **Sheet inferior** para ações e confirmações, com pegador arrastável.
- **Ação destrutiva com confirmação dupla** e em vermelho.
- **Feedback tátil** (`navigator.vibrate`) em toques importantes.
- **Safe areas** respeitadas via `env(safe-area-inset-*)`.
- **`prefers-reduced-motion`** desliga animações para quem precisa.

---

## 11. Testes

```bash
node tools/test.mjs
```

162 testes cobrindo: integridade dos dados estáticos (90 dias, 30 exercícios,
figuras), configurações, desbloqueio de dias, autosave e retomada de treino,
histórico de carga, **a regra de segurança do joelho**, registros diários,
diário, estatísticas, backup ida-e-volta, integridade do conteúdo do livro, navegação, offline,
PWA/manifest, atualização de cache e renderização das 21 telas.

`tools/fake-idb.mjs` é um IndexedDB em memória — permite testar toda a camada de
dados sem navegador.

---

## 12. Mapa de arquivos

```
css/book.css          Estilos do conteúdo do livro adaptado para tela
js/core/schema.js     Estrutura do banco, padrões, migrações
js/core/db.js         Wrapper IndexedDB em Promises
js/core/store.js      API única de dados (o coração)
js/core/autosave.js   Salvamento automático
js/core/stats.js      Estatísticas derivadas
js/core/backup.js     Exportar / importar / apagar
js/core/notifications.js  Lembretes
js/core/adapters.js   Extensões futuras
js/router.js          Roteamento por hash
js/ui.js              Helpers, toasts, sheets, gráficos SVG
js/icons.js           Ícones SVG
js/views/*.js         15 telas
data/book.data.js     15 capítulos integrais (gerado)
data/exercises.data.js 30 exercícios completos (gerado)
data/stretches.data.js Alongamentos e aquecimentos (gerado)
data/program.data.js  90 dias (gerado)
data/figures.data.js  40 figuras vetoriais (gerado)
```


---

## 13. De onde vem o conteúdo (Etapa 4)

Os arquivos em `data/` são **gerados**, nunca editados à mão. Os geradores vivem
na pasta do livro (`projeto_renata/`):

| Script | Gera | A partir de |
|---|---|---|
| `export_book.py` | `book.data.js` | `book.html` (o PDF de 180 páginas) |
| `export_exercises.py` | `exercises.data.js`, `stretches.data.js` | `exercises.py` |
| (inline) | `program.data.js` | `program.py` — a mesma engine do livro |
| (inline) | `figures.data.js` | `poses.py` |

**Por que assim:** o app não pode divergir do livro. Extraindo do HTML já
diagramado, o texto chega integral, sem redigitação e sem risco de omissão.
Para atualizar o conteúdo, altere o livro e rode os geradores novamente.

O `export_book.py` faz três adaptações de impresso para tela:
1. remove a capa do capítulo (a tela já tem cabeçalho), preservando o parágrafo
   de abertura;
2. converte unidades de impressão (mm) para pixels;
3. envolve tabelas em um contêiner rolável e mapeia as caixas do livro para os
   `callout` do app.
