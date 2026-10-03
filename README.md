# HortiFruti

Site do hortifruti com painel administrativo: o dono define as **promoções da semana**, cadastra **produtos novos** e controla o **estoque**. O site mostra tudo em tempo real.

## Como rodar

Precisa do [Node.js](https://nodejs.org) **22.5 ou mais novo** (o banco SQLite já vem embutido, não precisa instalar nem compilar nada). Em Node mais antigo, rode também `npm install better-sqlite3`.

```bash
npm install
npm start
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin

Na **primeira execução** o terminal mostra o usuário (`admin`) e uma senha gerada. Anote, entre no painel e troque a senha em "Trocar senha". Para escolher usuário e senha iniciais, copie `.env.example` para `.env` e preencha `ADMIN_USER` e `ADMIN_PASSWORD` antes de rodar pela primeira vez.

Na primeira vez também são cadastrados 19 produtos de exemplo (os que estavam no `script.js` antigo).

`npm test` roda os testes da API (login, produtos, promoções, estoque, upload e segurança).

## O que o painel faz

- **Produtos**: criar, editar, excluir, mostrar/ocultar no site, foto por link ou enviada do computador.
- **Promoções da semana**: escolhe o produto, digita o preço promocional *ou* o % de desconto, e define até quando vale. Quando a data passa, a promoção sai do site sozinha. "Encerrar todas" zera tudo para começar outra semana.
- **Estoque**: entrada, saída ou contagem, com motivo. Avisa produtos com estoque baixo (limite definido em cada produto) e esgotados, e guarda o histórico das movimentações.

No site, o produto esgotado aparece desabilitado, o carrinho não deixa passar do estoque, e o pedido é enviado pronto para o WhatsApp da loja. **O estoque não baixa sozinho**: depois de confirmar a venda, registre a "Saída" no painel.

## Estrutura

```
index.html, script.js, stiles.css   site (o script busca os produtos em /api/produtos)
admin/                              painel (index.html, admin.css, admin.js)
server/                             API Express + SQLite (app.js, db.js, seed.js, server.js, test.js)
data/                               banco de dados (criado automaticamente, fora do git)
uploads/                            fotos enviadas pelo painel (fora do git)
```

## Publicar

Como agora existe servidor, não funciona em hospedagem só de arquivos (GitHub Pages). Use algo que rode Node, como Render, Railway ou uma VPS, com:

- `NODE_ENV=production` e `TRUST_PROXY=1` (atrás de HTTPS);
- um disco persistente para as pastas `data/` e `uploads/` (ou mude `DB_PATH`), senão o banco some a cada deploy;
- faça backup periódico do arquivo `data/hortifruti.db`.

## Segurança já incluída

Senhas com bcrypt, sessão em cookie `HttpOnly` + `SameSite=Strict`, bloqueio após 5 tentativas erradas de login, validação de tudo que entra na API, upload só de imagem real (confere o conteúdo, máx. 2 MB), textos escapados na tela e apenas os arquivos do site são servidos (código do servidor, banco e `.git` não ficam públicos).
