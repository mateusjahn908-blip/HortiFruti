const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');

const ROOT = path.join(__dirname, '..');
const CATEGORIAS = ['Frutas', 'Verduras', 'Legumes', 'Mercearia', 'Bebidas', 'Laticínios'];
const UNIDADES = ['un', 'kg', 'maço', 'bandeja', 'pacote'];
const COOKIE = 'hf_session';
const SESSAO_HORAS = 8;
const HASH_FALSO = bcrypt.hashSync('hortifruti-hash-falso', 10);

// ---------- utilidades ----------
const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }); // YYYY-MM-DD
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const reais = c => c / 100;

class ErroHttp extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}
const erro = (status, msg) => new ErroHttp(status, msg);

function dataValida(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function parseCookies(header = '') {
  const out = {};
  for (const parte of header.split(';')) {
    const i = parte.indexOf('=');
    if (i > 0) out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return out;
}

function createApp(db, opcoes = {}) {
  const app = express();
  const producao = opcoes.producao ?? process.env.NODE_ENV === 'production';
  const uploadsDir = opcoes.uploadsDir || path.join(ROOT, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  if (opcoes.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '3mb' }));

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin'
    });
    next();
  });

  // ---------- transformação de produto ----------
  const promoAtiva = p => p.promo_centavos != null && p.promo_centavos < p.preco_centavos &&
    (!p.promo_ate || p.promo_ate >= hoje());

  function paraPublico(p) {
    const promo = promoAtiva(p);
    const atual = promo ? p.promo_centavos : p.preco_centavos;
    return {
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      unidade: p.unidade,
      preco: reais(atual),
      precoAntigo: promo ? reais(p.preco_centavos) : null,
      desconto: promo ? Math.round((1 - p.promo_centavos / p.preco_centavos) * 100) : 0,
      emPromocao: promo,
      promoAte: promo ? p.promo_ate : null,
      estoque: p.estoque,
      disponivel: p.estoque > 0,
      imagem: p.imagem
    };
  }

  function paraAdmin(p) {
    return {
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      unidade: p.unidade,
      preco: reais(p.preco_centavos),
      promoPreco: p.promo_centavos != null ? reais(p.promo_centavos) : null,
      promoAte: p.promo_ate,
      emPromocao: promoAtiva(p),
      promoExpirada: p.promo_centavos != null && !promoAtiva(p),
      estoque: p.estoque,
      estoqueMinimo: p.estoque_minimo,
      imagem: p.imagem,
      ativo: !!p.ativo,
      atualizadoEm: p.atualizado_em
    };
  }

  // ---------- validação ----------
  function lerPreco(v, campo) {
    const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
    if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 99999) throw erro(400, `${campo} inválido.`);
    return Math.round(n * 100);
  }
  function lerInteiro(v, campo, max = 1000000) {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > max) throw erro(400, `${campo} deve ser um número inteiro entre 0 e ${max}.`);
    return n;
  }
  function lerImagem(v) {
    if (v == null || v === '') return '';
    if (typeof v !== 'string' || v.length > 2000 || !/^(https?:\/\/|\/uploads\/)/i.test(v)) {
      throw erro(400, 'Imagem inválida. Use um link http(s) ou envie um arquivo.');
    }
    return v;
  }
  function lerPromo(preco, ate, precoNormalCentavos) {
    const c = lerPreco(preco, 'Preço promocional');
    if (c >= precoNormalCentavos) throw erro(400, 'O preço promocional precisa ser menor que o preço normal.');
    if (ate != null && ate !== '') {
      if (!dataValida(ate)) throw erro(400, 'Data final da promoção inválida.');
      if (ate < hoje()) throw erro(400, 'A data final da promoção já passou.');
    }
    return { centavos: c, ate: ate || null };
  }
  function lerProduto(b, parcial = false) {
    if (!b || typeof b !== 'object') throw erro(400, 'Dados inválidos.');
    const out = {};
    if (!parcial || b.nome !== undefined) {
      const nome = String(b.nome ?? '').trim();
      if (nome.length < 2 || nome.length > 80) throw erro(400, 'O nome deve ter entre 2 e 80 caracteres.');
      out.nome = nome;
    }
    if (!parcial || b.categoria !== undefined) {
      if (!CATEGORIAS.includes(b.categoria)) throw erro(400, 'Categoria inválida.');
      out.categoria = b.categoria;
    }
    if (!parcial || b.unidade !== undefined) {
      if (!UNIDADES.includes(b.unidade)) throw erro(400, 'Unidade inválida.');
      out.unidade = b.unidade;
    }
    if (!parcial || b.preco !== undefined) out.preco_centavos = lerPreco(b.preco, 'Preço');
    if (!parcial || b.estoqueMinimo !== undefined) out.estoque_minimo = lerInteiro(b.estoqueMinimo ?? 5, 'Estoque mínimo');
    if (!parcial || b.imagem !== undefined) out.imagem = lerImagem(b.imagem);
    if (b.ativo !== undefined) out.ativo = b.ativo ? 1 : 0;
    return out;
  }

  // ---------- sessão / autenticação ----------
  const tentativas = new Map(); // ip -> { n, ate }
  function limiteLogin(ip) {
    const t = tentativas.get(ip);
    if (t && t.ate > Date.now() && t.n >= 5) throw erro(429, 'Muitas tentativas. Aguarde alguns minutos e tente de novo.');
  }
  function falhaLogin(ip) {
    const t = tentativas.get(ip);
    if (!t || t.ate <= Date.now()) tentativas.set(ip, { n: 1, ate: Date.now() + 15 * 60 * 1000 });
    else t.n += 1;
  }

  function criarSessao(res, usuarioId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expira = Date.now() + SESSAO_HORAS * 3600 * 1000;
    db.prepare('INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?,?,?)').run(sha256(token), usuarioId, expira);
    res.cookie(COOKIE, token, {
      httpOnly: true, sameSite: 'strict', secure: producao, maxAge: SESSAO_HORAS * 3600 * 1000, path: '/'
    });
  }

  function exigirAdmin(req, res, next) {
    db.prepare('DELETE FROM sessoes WHERE expira_em < ?').run(Date.now());
    const token = parseCookies(req.headers.cookie)[COOKIE];
    const u = token && db.prepare(`SELECT u.id, u.usuario, s.token_hash FROM sessoes s
      JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ? AND s.expira_em > ?`).get(sha256(token), Date.now());
    if (!u) return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });
    req.usuario = u;
    next();
  }

  // Defesa extra contra CSRF: escritas só com JSON (formulários de outros sites não conseguem enviar isso).
  function exigirJson(req, res, next) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.is('application/json')) {
      return res.status(415).json({ erro: 'Content-Type deve ser application/json.' });
    }
    next();
  }

  // ---------- API pública ----------
  app.get('/api/produtos', (req, res) => {
    const linhas = db.prepare('SELECT * FROM produtos WHERE ativo = 1 ORDER BY id').all();
    res.set('Cache-Control', 'no-store').json({ categorias: CATEGORIAS, produtos: linhas.map(paraPublico) });
  });

  // ---------- API admin ----------
  const admin = express.Router();
  admin.use(exigirJson);

  admin.post('/login', (req, res) => {
    limiteLogin(req.ip);
    const { usuario, senha } = req.body || {};
    const u = typeof usuario === 'string' && db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario.trim());
    // compara sempre um hash, para o tempo de resposta não revelar se o usuário existe
    const hash = u ? u.senha_hash : HASH_FALSO;
    const ok = bcrypt.compareSync(typeof senha === 'string' ? senha : '', hash) && !!u;
    if (!ok) {
      falhaLogin(req.ip);
      return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
    }
    tentativas.delete(req.ip);
    criarSessao(res, u.id);
    res.json({ usuario: u.usuario });
  });

  admin.post('/logout', (req, res) => {
    const token = parseCookies(req.headers.cookie)[COOKIE];
    if (token) db.prepare('DELETE FROM sessoes WHERE token_hash = ?').run(sha256(token));
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  admin.use(exigirAdmin);

  admin.get('/me', (req, res) => res.json({ usuario: req.usuario.usuario, categorias: CATEGORIAS, unidades: UNIDADES }));

  admin.post('/senha', (req, res) => {
    const { atual, nova } = req.body || {};
    const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id);
    if (!bcrypt.compareSync(String(atual ?? ''), u.senha_hash)) throw erro(400, 'A senha atual está incorreta.');
    if (typeof nova !== 'string' || nova.length < 8) throw erro(400, 'A nova senha precisa ter pelo menos 8 caracteres.');
    db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(bcrypt.hashSync(nova, 10), u.id);
    db.prepare('DELETE FROM sessoes WHERE usuario_id = ? AND token_hash != ?').run(u.id, req.usuario.token_hash);
    res.json({ ok: true });
  });

  admin.get('/produtos', (req, res) => {
    res.json({ produtos: db.prepare('SELECT * FROM produtos ORDER BY nome COLLATE NOCASE').all().map(paraAdmin) });
  });

  const buscar = id => {
    const p = db.prepare('SELECT * FROM produtos WHERE id = ?').get(Number(id));
    if (!p) throw erro(404, 'Produto não encontrado.');
    return p;
  };

  admin.post('/produtos', (req, res) => {
    const dados = lerProduto(req.body);
    const estoque = lerInteiro(req.body.estoque ?? 0, 'Estoque');
    const id = db.transaction(() => {
      const r = db.prepare(`INSERT INTO produtos (nome, categoria, unidade, preco_centavos, estoque, estoque_minimo, imagem, ativo)
        VALUES (@nome, @categoria, @unidade, @preco_centavos, @estoque, @estoque_minimo, @imagem, @ativo)`)
        .run({ ativo: 1, ...dados, estoque });
      db.prepare(`INSERT INTO movimentos (produto_id, tipo, quantidade, estoque_apos, motivo, usuario)
        VALUES (?, 'inicial', ?, ?, 'Produto cadastrado', ?)`).run(r.lastInsertRowid, estoque, estoque, req.usuario.usuario);
      return r.lastInsertRowid;
    })();
    res.status(201).json({ produto: paraAdmin(buscar(id)) });
  });

  admin.put('/produtos/:id', (req, res) => {
    const atual = buscar(req.params.id);
    const dados = lerProduto(req.body, true);
    // se o preço normal subir/descer, a promoção continua válida só se ainda for menor
    if (dados.preco_centavos != null && atual.promo_centavos != null && atual.promo_centavos >= dados.preco_centavos) {
      throw erro(400, 'O preço normal ficaria menor ou igual ao da promoção. Remova ou ajuste a promoção primeiro.');
    }
    const campos = Object.keys(dados);
    if (campos.length) {
      db.prepare(`UPDATE produtos SET ${campos.map(c => `${c} = @${c}`).join(', ')}, atualizado_em = datetime('now') WHERE id = @id`)
        .run({ ...dados, id: atual.id });
    }
    res.json({ produto: paraAdmin(buscar(atual.id)) });
  });

  admin.delete('/produtos/:id', (req, res) => {
    const p = buscar(req.params.id);
    db.prepare('DELETE FROM produtos WHERE id = ?').run(p.id);
    res.json({ ok: true });
  });

  // promoções da semana
  admin.put('/produtos/:id/promocao', (req, res) => {
    const p = buscar(req.params.id);
    const promo = lerPromo(req.body?.preco, req.body?.ate, p.preco_centavos);
    db.prepare("UPDATE produtos SET promo_centavos = ?, promo_ate = ?, atualizado_em = datetime('now') WHERE id = ?")
      .run(promo.centavos, promo.ate, p.id);
    res.json({ produto: paraAdmin(buscar(p.id)) });
  });

  admin.delete('/produtos/:id/promocao', (req, res) => {
    const p = buscar(req.params.id);
    db.prepare("UPDATE produtos SET promo_centavos = NULL, promo_ate = NULL, atualizado_em = datetime('now') WHERE id = ?").run(p.id);
    res.json({ produto: paraAdmin(buscar(p.id)) });
  });

  admin.delete('/promocoes', (req, res) => {
    const r = db.prepare("UPDATE produtos SET promo_centavos = NULL, promo_ate = NULL, atualizado_em = datetime('now') WHERE promo_centavos IS NOT NULL").run();
    res.json({ removidas: r.changes });
  });

  // estoque
  admin.patch('/produtos/:id/estoque', (req, res) => {
    const p = buscar(req.params.id);
    const { tipo, motivo } = req.body || {};
    const qtd = lerInteiro(req.body?.quantidade, 'Quantidade');
    let novo;
    if (tipo === 'entrada') novo = p.estoque + qtd;
    else if (tipo === 'saida') {
      if (qtd > p.estoque) throw erro(400, `Só há ${p.estoque} em estoque. Não dá para retirar ${qtd}.`);
      novo = p.estoque - qtd;
    } else if (tipo === 'ajuste') novo = qtd;
    else throw erro(400, 'Tipo de movimento inválido.');
    if (novo > 1000000) throw erro(400, 'Estoque acima do limite permitido.');

    db.transaction(() => {
      db.prepare("UPDATE produtos SET estoque = ?, atualizado_em = datetime('now') WHERE id = ?").run(novo, p.id);
      db.prepare(`INSERT INTO movimentos (produto_id, tipo, quantidade, estoque_apos, motivo, usuario) VALUES (?,?,?,?,?,?)`)
        .run(p.id, tipo, novo - p.estoque, novo, String(motivo ?? '').slice(0, 200), req.usuario.usuario);
    })();
    res.json({ produto: paraAdmin(buscar(p.id)) });
  });

  admin.get('/movimentos', (req, res) => {
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 40, 1), 200);
    const linhas = db.prepare(`SELECT m.*, p.nome AS produto FROM movimentos m JOIN produtos p ON p.id = m.produto_id
      ORDER BY m.id DESC LIMIT ?`).all(limite);
    res.json({ movimentos: linhas });
  });

  // upload de imagem (enviada em base64 dentro do JSON, até 2 MB)
  const ASSINATURAS = [
    { ext: 'jpg', mime: 'image/jpeg', ok: b => b[0] === 0xff && b[1] === 0xd8 },
    { ext: 'png', mime: 'image/png', ok: b => b.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])) },
    { ext: 'webp', mime: 'image/webp', ok: b => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' },
    { ext: 'gif', mime: 'image/gif', ok: b => b.slice(0, 3).toString() === 'GIF' }
  ];
  admin.post('/upload', (req, res) => {
    const m = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(req.body?.dataUrl || '');
    if (!m) throw erro(400, 'Arquivo inválido. Envie uma imagem JPG, PNG, WEBP ou GIF.');
    const buf = Buffer.from(m[2], 'base64');
    if (buf.length > 2 * 1024 * 1024) throw erro(413, 'A imagem passa de 2 MB. Reduza o tamanho e tente de novo.');
    const tipo = ASSINATURAS.find(a => a.mime === m[1] && a.ok(buf));
    if (!tipo) throw erro(400, 'O conteúdo do arquivo não é uma imagem JPG, PNG, WEBP ou GIF válida.');
    const nome = `${crypto.randomBytes(12).toString('hex')}.${tipo.ext}`;
    fs.writeFileSync(path.join(uploadsDir, nome), buf);
    res.status(201).json({ url: `/uploads/${nome}` });
  });

  app.use('/api/admin', admin);
  app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

  // ---------- arquivos estáticos (lista explícita: o resto do projeto não fica exposto) ----------
  const arquivo = nome => (req, res) => res.sendFile(path.join(ROOT, nome));
  app.get('/', arquivo('index.html'));
  app.get('/index.html', arquivo('index.html'));
  app.get('/script.js', arquivo('script.js'));
  app.get('/stiles.css', arquivo('stiles.css'));
  app.use('/uploads', express.static(uploadsDir, { index: false, dotfiles: 'deny', maxAge: '7d' }));
  app.use('/admin', (req, res, next) => { res.set('Cache-Control', 'no-cache'); next(); },
    express.static(path.join(ROOT, 'admin'), { index: 'index.html' }));

  // ---------- erros ----------
  app.use((err, req, res, _next) => {
    if (err.type === 'entity.too.large') return res.status(413).json({ erro: 'Arquivo grande demais.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
    if (err instanceof ErroHttp) return res.status(err.status).json({ erro: err.message });
    console.error(err);
    res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
  });

  return app;
}

module.exports = { createApp, CATEGORIAS, UNIDADES };
