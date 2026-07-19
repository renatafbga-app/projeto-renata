# Publicação, instalação e manutenção

Guia operacional. Siga na ordem.

---

## 1. Qual pasta publicar

Publique **`projeto-renata-publicar/`** — é a versão limpa, gerada por:

```bash
node tools/build.mjs
```

Ela contém apenas os arquivos que o app precisa (os mesmos que o Service Worker
coloca em cache) mais a documentação. A pasta `projeto-renata-app/` é o ambiente
de desenvolvimento e inclui testes e ferramentas que não vão para o ar.

---

## 2. Publicar no GitHub Pages

### Pela interface do site (sem terminal)

1. Acesse [github.com/new](https://github.com/new) e crie um repositório —
   por exemplo `projeto-renata`. Pode ser **público** ou **privado**
   (Pages funciona em privado apenas em contas pagas; se a sua for gratuita,
   escolha público).
2. Na página do repositório vazio, clique em **uploading an existing file**.
3. Abra a pasta `projeto-renata-publicar/` no Finder, selecione **todo o
   conteúdo de dentro** dela (não a pasta em si) e arraste para o navegador.
   > Importante: o `index.html` precisa ficar na raiz do repositório.
4. Clique em **Commit changes**.
5. Vá em **Settings → Pages**.
6. Em *Source*, escolha **Deploy from a branch**.
7. Em *Branch*, selecione **main** e a pasta **/ (root)**. Clique em **Save**.
8. Aguarde de 1 a 3 minutos. A URL aparece no topo da mesma página:
   `https://SEU-USUARIO.github.io/projeto-renata/`

### Pelo terminal

```bash
cd projeto-renata-publicar
git init
git add .
git commit -m "Projeto Renata v1.0.0"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/projeto-renata.git
git push -u origin main
```

Depois faça os passos 5 a 8 acima.

### Alternativa mais rápida — Netlify

1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta `projeto-renata-publicar/` inteira para a página
3. Você recebe uma URL HTTPS em segundos, sem criar conta

---

## 3. Instalar no iPhone

O PWA **só instala pelo Safari**. O Chrome no iOS não oferece a opção.

1. Abra a URL publicada **no Safari**
2. Aguarde alguns segundos na primeira vez — o app está baixando tudo para
   funcionar offline
3. Toque no botão **Compartilhar** (quadrado com seta para cima, na barra inferior)
4. Role a lista e toque em **Adicionar à Tela de Início**
5. Confirme o nome "Projeto Renata" e toque em **Adicionar**
6. Feche o Safari e abra pelo ícone na tela inicial

A partir daí o app abre em tela cheia, sem barra de navegação, e **funciona sem
internet**.

### Ativar as notificações

Nos **Ajustes** do app (engrenagem → Lembretes), ligue "Ativar lembretes" e
aceite a permissão quando o iPhone perguntar.

> **Limitação do iOS, não do app:** sem um servidor de push, o iPhone não entrega
> notificação com o app fechado. Os lembretes chegam com o app aberto, e os
> pendentes do dia aparecem assim que você o abre.

---

## 4. Backup e restauração

### Fazer backup

**Configurações → Exportar backup**

Gera um arquivo `projeto-renata-backup-AAAA-MM-DD.json` com absolutamente todos
os seus dados: treinos, cargas, peso, medidas, água, alimentação, sono, humor,
dor no joelho, diário e configurações.

No iPhone, o arquivo vai para **Arquivos → Downloads**. Recomendo salvar no
iCloud Drive ou enviar para você mesma por e-mail.

**Faça isso uma vez por mês.**

### Restaurar

**Configurações → Importar backup** → selecione o arquivo `.json`.

A importação funciona em modo *merge*: mantém o que já existe e sobrescreve os
registros de mesma data. Para restaurar num aparelho novo, basta importar.

### Apagar tudo

**Configurações → Apagar todos os dados**, com confirmação dupla. Remove apenas
os seus registros — o conteúdo do livro permanece.

---

## 5. Publicar uma versão nova sem perder dados

1. Faça as alterações nos arquivos
2. Abra `service-worker.js` e mude a linha:
   ```js
   const CACHE_VERSION = 'v1.0.0';   // → 'v1.0.1'
   ```
3. Rode `node tools/build.mjs`
4. Envie a pasta `projeto-renata-publicar/` para o mesmo repositório
5. No iPhone, feche e reabra o app

Ao reabrir, aparece o aviso "Nova versão disponível". Feche completamente o app
(deslize para cima no seletor de apps) e abra de novo para aplicar.

### Por que seus dados não somem

O Service Worker manipula **exclusivamente** a Cache Storage, que guarda os
arquivos do aplicativo. Ele não tem uma única linha de código que acesse
IndexedDB ou localStorage — que é onde ficam os seus registros. Trocar a versão
apaga arquivos antigos do app e nada mais.

Ainda assim: **exporte um backup antes de qualquer atualização.** É barato e
elimina a dúvida.

---

## 6. Se algo der errado

| Sintoma | O que fazer |
|---|---|
| App não abre offline | Abra online uma vez e aguarde 10 s para o cache completar |
| Não aparece "Adicionar à Tela de Início" | Você está no Chrome. Use o Safari |
| Tela em branco após atualizar | Feche o app por completo e reabra |
| Dados sumiram | Configurações → Importar backup |
| Mudanças não aparecem | Faltou trocar o `CACHE_VERSION` |

Nunca use "Limpar dados de sites" nos ajustes do Safari — isso apaga o
IndexedDB e, com ele, seus registros.
