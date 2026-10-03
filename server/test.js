// Teste de integração: sobe o app com um banco temporário e exercita a API.  Uso: npm test
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const bcrypt = require('bcryptjs');
const { openDb } = require('./db');
const { seedSeVazio } = require('./seed');
const { createApp } = require('./app');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-'));
const db = openDb(path.join(tmp, 'teste.db'));
seedSeVazio(db);
db.prepare('INSERT INTO usuarios (usuario, senha_hash) VALUES (?, ?)').run('admin', bcrypt.hashSync('senha-de-teste', 4));

const server = createApp(db, { uploadsDir: path.join(tmp, 'uploads') }).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
let cookie = '';

async function req(metodo, url, corpo, extra = {}) {
  const headers = { ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...extra };
  const r = await fetch(base + url, { method: metodo, headers, body: corpo !== undefined ? JSON.stringify(corpo) : undefined, redirect: 'manual' });
  const set = r.headers.get('set-cookie');
  if (set && set.startsWith('hf_session=') && !/hf_session=;/.test(set)) cookie = set.split(';')[0];
  let json = null;
  try { json = await r.clone().json(); } catch { /* não é JSON */ }
  return { status: r.status, json, headers: r.headers, res: r };
}

let ok = 0;
async function teste(nome, fn) {
  try { await fn(); ok++; console.log('  ✓', nome); }
  catch (e) { console.error('  ✗', nome, '\n   ', e.message); process.exitCode = 1; }
}

(async () => {
  console.log('API pública');
  await teste('lista produtos ativos com preço, promoção e estoque', async () => {
    const { status, json } = await req('GET', '/api/produtos');
    assert.equal(status, 200);
    assert.ok(json.produtos.length >= 15);
    const banana = json.produtos.find(p => p.nome === 'Banana');
    assert.equal(banana.emPromocao, true);
    assert.equal(banana.preco, 4.99);
    assert.equal(banana.precoAntigo, 6.49);
    assert.equal(banana.desconto, 23);
    const ervilha = json.produtos.find(p => p.nome === 'Ervilha');
    assert.equal(ervilha.disponivel, false);
  });

  console.log('Proteção do admin');
  await teste('rotas do admin exigem login', async () => {
    for (const [m, u] of [['GET', '/api/admin/produtos'], ['GET', '/api/admin/movimentos'], ['GET', '/api/admin/me']]) {
      assert.equal((await req(m, u)).status, 401, u);
    }
    assert.equal((await req('POST', '/api/admin/produtos', { nome: 'x' })).status, 401);
  });
  await teste('login com senha errada falha', async () => {
    const r = await req('POST', '/api/admin/login', { usuario: 'admin', senha: 'errada' });
    assert.equal(r.status, 401);
    assert.ok(!cookie);
  });
  await teste('escrita sem JSON é recusada (defesa CSRF)', async () => {
    const r = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
    assert.equal(r.status, 415);
  });
  await teste('login correto cria cookie HttpOnly + SameSite=Strict', async () => {
    const r = await req('POST', '/api/admin/login', { usuario: 'admin', senha: 'senha-de-teste' });
    assert.equal(r.status, 200);
    const set = r.headers.get('set-cookie');
    assert.match(set, /HttpOnly/i);
    assert.match(set, /SameSite=Strict/i);
    assert.ok(cookie.startsWith('hf_session='));
  });

  console.log('Produtos');
  let novoId;
  await teste('cria produto e registra estoque inicial', async () => {
    const r = await req('POST', '/api/admin/produtos', { nome: 'Uva Thompson', categoria: 'Frutas', unidade: 'kg', preco: '12,90', estoque: 25, estoqueMinimo: 8, imagem: '' });
    assert.equal(r.status, 201, JSON.stringify(r.json));
    assert.equal(r.json.produto.preco, 12.9);
    assert.equal(r.json.produto.estoque, 25);
    novoId = r.json.produto.id;
    const m = await req('GET', '/api/admin/movimentos');
    assert.equal(m.json.movimentos[0].produto, 'Uva Thompson');
    assert.equal(m.json.movimentos[0].tipo, 'inicial');
  });
  await teste('rejeita dados inválidos', async () => {
    const base = { nome: 'Teste', categoria: 'Frutas', unidade: 'kg', preco: 5, estoque: 1 };
    for (const ruim of [
      { ...base, nome: '' }, { ...base, preco: -1 }, { ...base, preco: 'abc' }, { ...base, categoria: 'Carros' },
      { ...base, unidade: 'ton' }, { ...base, estoque: -3 }, { ...base, estoque: 1.5 },
      { ...base, imagem: 'javascript:alert(1)' }, { ...base, imagem: 'data:text/html,x' }
    ]) assert.equal((await req('POST', '/api/admin/produtos', ruim)).status, 400, JSON.stringify(ruim));
  });
  await teste('edita produto e valida preço da promoção ao mudar o preço normal', async () => {
    const r = await req('PUT', `/api/admin/produtos/${novoId}`, { nome: 'Uva Thompson Sem Semente', preco: 14 });
    assert.equal(r.status, 200);
    assert.equal(r.json.produto.nome, 'Uva Thompson Sem Semente');
    assert.equal(r.json.produto.preco, 14);
  });

  console.log('Promoções');
  await teste('define promoção e aparece no site com desconto', async () => {
    const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const r = await req('PUT', `/api/admin/produtos/${novoId}/promocao`, { preco: 9.9, ate: amanha });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const pub = (await req('GET', '/api/produtos')).json.produtos.find(p => p.id === novoId);
    assert.equal(pub.emPromocao, true);
    assert.equal(pub.preco, 9.9);
    assert.equal(pub.precoAntigo, 14);
    assert.equal(pub.desconto, 29);
  });
  await teste('promoção maior que o preço normal ou com data passada é recusada', async () => {
    assert.equal((await req('PUT', `/api/admin/produtos/${novoId}/promocao`, { preco: 20 })).status, 400);
    assert.equal((await req('PUT', `/api/admin/produtos/${novoId}/promocao`, { preco: 5, ate: '2020-01-01' })).status, 400);
    assert.equal((await req('PUT', `/api/admin/produtos/${novoId}/promocao`, { preco: 5, ate: '2026-02-31' })).status, 400);
  });
  await teste('promoção vencida deixa de valer sozinha', async () => {
    db.prepare("UPDATE produtos SET promo_ate = '2020-01-01' WHERE id = ?").run(novoId);
    const pub = (await req('GET', '/api/produtos')).json.produtos.find(p => p.id === novoId);
    assert.equal(pub.emPromocao, false);
    assert.equal(pub.preco, 14);
    const adm = (await req('GET', '/api/admin/produtos')).json.produtos.find(p => p.id === novoId);
    assert.equal(adm.promoExpirada, true);
  });
  await teste('remove promoção', async () => {
    const r = await req('DELETE', `/api/admin/produtos/${novoId}/promocao`, {});
    assert.equal(r.json.produto.promoPreco, null);
  });

  console.log('Estoque');
  await teste('entrada, saída e ajuste atualizam o estoque e o histórico', async () => {
    let r = await req('PATCH', `/api/admin/produtos/${novoId}/estoque`, { tipo: 'entrada', quantidade: 10, motivo: 'Compra' });
    assert.equal(r.json.produto.estoque, 35);
    r = await req('PATCH', `/api/admin/produtos/${novoId}/estoque`, { tipo: 'saida', quantidade: 5, motivo: 'Venda' });
    assert.equal(r.json.produto.estoque, 30);
    r = await req('PATCH', `/api/admin/produtos/${novoId}/estoque`, { tipo: 'ajuste', quantidade: 12 });
    assert.equal(r.json.produto.estoque, 12);
    const m = (await req('GET', '/api/admin/movimentos')).json.movimentos.filter(x => x.produto.startsWith('Uva')).slice(0, 3);
    assert.deepEqual(m.map(x => x.quantidade), [-18, -5, 10]);
    assert.deepEqual(m.map(x => x.estoque_apos), [12, 30, 35]);
  });
  await teste('não deixa o estoque ficar negativo', async () => {
    const r = await req('PATCH', `/api/admin/produtos/${novoId}/estoque`, { tipo: 'saida', quantidade: 999 });
    assert.equal(r.status, 400);
    assert.equal((await req('PATCH', `/api/admin/produtos/${novoId}/estoque`, { tipo: 'saida', quantidade: -1 })).status, 400);
    assert.equal((await req('PATCH', `/api/admin/produtos/${novoId}/estoque`, { tipo: 'roubo', quantidade: 1 })).status, 400);
  });
  await teste('produto inativo some do site mas continua no admin', async () => {
    await req('PUT', `/api/admin/produtos/${novoId}`, { ativo: false });
    assert.ok(!(await req('GET', '/api/produtos')).json.produtos.some(p => p.id === novoId));
    assert.ok((await req('GET', '/api/admin/produtos')).json.produtos.some(p => p.id === novoId));
  });

  console.log('Upload');
  await teste('aceita PNG de verdade e recusa arquivo disfarçado', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
    const bom = await req('POST', '/api/admin/upload', { dataUrl: 'data:image/png;base64,' + png.toString('base64') });
    assert.equal(bom.status, 201, JSON.stringify(bom.json));
    assert.match(bom.json.url, /^\/uploads\/[a-f0-9]{24}\.png$/);
    const arq = await fetch(base + bom.json.url);
    assert.equal(arq.status, 200);
    const falso = await req('POST', '/api/admin/upload', { dataUrl: 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64') });
    assert.equal(falso.status, 400);
    const svg = await req('POST', '/api/admin/upload', { dataUrl: 'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64') });
    assert.equal(svg.status, 400);
  });

  console.log('Arquivos estáticos');
  await teste('serve o site e o admin, mas não expõe código do servidor, banco nem .git', async () => {
    for (const u of ['/', '/script.js', '/stiles.css', '/admin/']) {
      const r = await fetch(base + u);
      assert.equal(r.status, 200, u);
    }
    for (const u of ['/server/app.js', '/data/hortifruti.db', '/package.json', '/.git/config', '/.env', '/node_modules/express/package.json', '/admin/../server/app.js', '/uploads/../server/app.js']) {
      const r = await fetch(base + u);
      assert.notEqual(r.status, 200, u + ' não deveria ser público');
    }
    assert.equal((await fetch(base + '/admin', { redirect: 'manual' })).status, 301);
  });

  console.log('Senha e logout');
  await teste('troca de senha exige a senha atual e mínimo de 8 caracteres', async () => {
    assert.equal((await req('POST', '/api/admin/senha', { atual: 'errada', nova: 'novasenha123' })).status, 400);
    assert.equal((await req('POST', '/api/admin/senha', { atual: 'senha-de-teste', nova: 'curta' })).status, 400);
    assert.equal((await req('POST', '/api/admin/senha', { atual: 'senha-de-teste', nova: 'novasenha123' })).status, 200);
  });
  await teste('logout invalida a sessão', async () => {
    assert.equal((await req('POST', '/api/admin/logout', {})).status, 200);
    const antigo = cookie;
    assert.equal((await req('GET', '/api/admin/me', undefined, { Cookie: antigo })).status, 401);
    cookie = '';
    assert.equal((await req('POST', '/api/admin/login', { usuario: 'admin', senha: 'senha-de-teste' })).status, 401);
    assert.equal((await req('POST', '/api/admin/login', { usuario: 'admin', senha: 'novasenha123' })).status, 200);
  });
  await teste('bloqueia força bruta após 5 falhas', async () => {
    cookie = '';
    let ultimo;
    for (let i = 0; i < 7; i++) ultimo = await req('POST', '/api/admin/login', { usuario: 'admin', senha: 'x' + i });
    assert.equal(ultimo.status, 429);
  });

  console.log(`\n${ok} testes passaram${process.exitCode ? ' (houve falhas)' : ''}.`);
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})();
