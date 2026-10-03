const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { openDb } = require('./db');
const { seedSeVazio } = require('./seed');
const { createApp } = require('./app');

// Carrega .env (se existir) sem depender de pacotes extras.
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  for (const linha of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(linha);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function garantirAdmin(db) {
  if (db.prepare('SELECT COUNT(*) n FROM usuarios').get().n > 0) return;
  const usuario = process.env.ADMIN_USER || 'admin';
  let senha = process.env.ADMIN_PASSWORD;
  const gerada = !senha;
  if (gerada) senha = crypto.randomBytes(9).toString('base64url');
  if (senha.length < 8) throw new Error('ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.');
  db.prepare('INSERT INTO usuarios (usuario, senha_hash) VALUES (?, ?)').run(usuario, bcrypt.hashSync(senha, 10));
  console.log('\n  Administrador criado.');
  console.log(`  Usuário: ${usuario}`);
  if (gerada) console.log(`  Senha:   ${senha}   (anote agora: ela não será mostrada de novo; troque no painel)`);
  console.log('');
}

function iniciar() {
  const db = openDb(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'hortifruti.db'));
  if (seedSeVazio(db)) console.log('  Produtos de exemplo cadastrados.');
  garantirAdmin(db);
  const app = createApp(db, { trustProxy: process.env.TRUST_PROXY === '1' });
  const porta = Number(process.env.PORT) || 3000;
  app.listen(porta, () => {
    console.log(`  Site:  http://localhost:${porta}`);
    console.log(`  Admin: http://localhost:${porta}/admin`);
  });
}

if (require.main === module) iniciar();
module.exports = { garantirAdmin };
