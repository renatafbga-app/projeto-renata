# Projeto Renata · App

Progressive Web App do programa de 90 dias. Sem frameworks, sem CDN, sem
bibliotecas externas. Funciona 100% offline depois da primeira abertura.

---

## Como executar localmente

O app **precisa de um servidor** — não basta dar duplo clique no `index.html`.
Módulos JavaScript e Service Worker são bloqueados pelo navegador no protocolo
`file://`, por segurança. Qualquer servidor estático resolve.

### Opção 1 — Python (já vem no macOS)

```bash
cd projeto-renata-app
python3 -m http.server 8080
```

Abra `http://localhost:8080` no navegador.

### Opção 2 — Node

```bash
cd projeto-renata-app
npx serve .
```

### Testar no iPhone pela rede local

1. Descubra o IP do computador: `ipconfig getifaddr en0`
2. Rode o servidor (opção 1 acima)
3. No iPhone, com o mesmo Wi-Fi, abra `http://SEU_IP:8080`

O Service Worker funciona em `localhost`, mas **não** em IP puro sem HTTPS.
Para instalar de verdade na tela inicial, use a hospedagem abaixo.

---

## Como publicar (necessário para instalar no iPhone)

Instalar um PWA no iPhone exige HTTPS. As duas opções são gratuitas.

### GitHub Pages

1. Crie um repositório e envie o conteúdo da pasta `projeto-renata-app/`
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`
3. Aguarde a URL `https://seuusuario.github.io/nome-do-repo/`

### Netlify (mais simples)

1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta `projeto-renata-app/` para a página
3. Pronto — você recebe uma URL HTTPS na hora

### Instalar no iPhone

1. Abra a URL **no Safari** (não funciona no Chrome do iOS)
2. Toque no botão **Compartilhar**
3. **Adicionar à Tela de Início**
4. Abra pelo ícone: o app roda em tela cheia, sem barra do Safari

Depois disso, funciona sem internet.

---

## Rodar os testes

```bash
node tools/test.mjs
```

120 testes, sem navegador (inclui auditoria de HTML × CSS e de texto renderizado). Cobrem dados, regras de negócio, backup e a
renderização das 19 telas.

---

## Publicar uma versão nova sem perder dados

1. Altere os arquivos
2. Em `service-worker.js`, mude `CACHE_VERSION` (ex.: `v1.0.0` → `v1.0.1`)
3. Publique

O app baixa os arquivos novos, apaga o cache velho e avisa "Nova versão
disponível". **Os dados da usuária não são tocados** — vivem em IndexedDB, que o
Service Worker não acessa.

---

## Backup

**Configurações → Exportar backup** gera um `.json` com absolutamente todos os
dados. Guarde-o antes de qualquer mudança grande. **Importar backup** restaura.

Recomendação: exporte uma vez por mês.

---

## Estrutura

```
index.html            App shell
manifest.json         Manifesto PWA
service-worker.js     Cache offline
css/                  Design system (5 arquivos, inclui book.css)
js/core/              Dados, autosave, estatísticas, backup, adaptadores
js/views/             19 telas
data/                 Conteúdo integral: 15 capítulos, 30 exercícios, 90 dias,
                      40 figuras, 7 alongamentos com ficha completa e 58 alimentos
icons/                Ícones do app
tools/                Testes
ARCHITECTURE.md       Decisões de arquitetura (leia antes de manter o código)
```

---

## Aviso de saúde

Material educativo, não substitui avaliação médica ou fisioterapêutica.
O programa considera inflamação na pata de ganso — obtenha liberação médica
antes de iniciar e interrompa qualquer exercício que cause dor aguda.
