// Banco SQLite (arquivo único em data/hortifruti.db). Preços ficam em centavos (inteiros).
// Usa o SQLite embutido no Node (node:sqlite, Node 22.5+), que não precisa compilar nada.
// Em Node mais antigo, cai para o pacote opcional better-sqlite3.
const fs = require('fs');
const path = require('path');

function abrirDriver(file) {
  const preferido = process.env.HF_SQLITE; // 'node' ou 'better' (útil para testes)
  if (preferido !== 'better') {
    let sqlite = null;
    try { sqlite = require('node:sqlite'); } catch { /* Node antigo */ }
    if (sqlite) {
      const raw = new sqlite.DatabaseSync(file);
      return {
        exec: sql => raw.exec(sql),
        prepare: sql => raw.prepare(sql),
        pragma: texto => raw.exec(`PRAGMA ${texto}`),
        close: () => raw.close(),
        transaction: fn => (...args) => {
          raw.exec('BEGIN');
          try { const r = fn(...args); raw.exec('COMMIT'); return r; }
          catch (e) { raw.exec('ROLLBACK'); throw e; }
        }
      };
    }
  }
  try {
    const Better = require('better-sqlite3');
    return new Better(file);
  } catch {
    throw new Error('Não encontrei um SQLite para usar. Atualize o Node para a versão 22.5 ou mais nova, ou rode "npm install better-sqlite3".');
  }
}

function openDb(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = abrirDriver(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessoes (
      token_hash TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira_em INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      unidade TEXT NOT NULL DEFAULT 'un',
      preco_centavos INTEGER NOT NULL,
      promo_centavos INTEGER,
      promo_ate TEXT,
      estoque INTEGER NOT NULL DEFAULT 0,
      estoque_minimo INTEGER NOT NULL DEFAULT 5,
      imagem TEXT NOT NULL DEFAULT '',
      ativo INTEGER NOT NULL DEFAULT 1,
      criado_em TEXT NOT NULL DEFAULT (datetime('now')),
      atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS movimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,              -- inicial | entrada | saida | ajuste
      quantidade INTEGER NOT NULL,     -- variação (positiva ou negativa)
      estoque_apos INTEGER NOT NULL,
      motivo TEXT NOT NULL DEFAULT '',
      usuario TEXT NOT NULL DEFAULT '',
      criado_em TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_mov_produto ON movimentos(produto_id, id DESC);
  `);
  return db;
}

module.exports = { openDb };
