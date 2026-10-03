// Produtos iniciais (migrados do script.js antigo). Roda só se a tabela estiver vazia.
const U = 'https://images.unsplash.com/';
const q = '?auto=format&fit=crop&w=600&q=80';

// [nome, categoria, unidade, preço, preço promocional|null, estoque, imagem]
const PRODUTOS = [
  ['Banana', 'Frutas', 'kg', 6.49, 4.99, 60, U + 'photo-1587132137056-bfbf0166836e' + q],
  ['Maçã Gorda', 'Frutas', 'kg', 5.49, 3.99, 45, U + 'photo-1567306226416-28f0efdc88ce' + q],
  ['Laranja', 'Frutas', 'kg', 4.49, 2.99, 80, U + 'photo-1611080626919-7cf5a9dbab5b' + q],
  ['Tomate', 'Legumes', 'kg', 7.49, 5.99, 30, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxxaOpMXDTRKj1Z0zZ_Y0pMGXmLR7tQ1YlPhUHEM6ISw&s=10'],
  ['Alface', 'Verduras', 'un', 3.49, null, 25, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3ZRWdTKY61SqP2EiduTm84qEMp3X_A63I1giu0BTRhA&s=10'],
  ['Morango', 'Frutas', 'bandeja', 10.99, 8.99, 12, U + 'photo-1464965911861-746a04b4bca6' + q],
  ['Abacaxi', 'Frutas', 'un', 12.99, 9.99, 4, 'https://www.estadao.com.br/resizer/v2/GEUVV5EDH5FUVEQJ6YYTV3JERA.jpeg?quality=80&auth=06f90ffbbfbc0d6a8ccc45f21a493500fce0cef5a6b0fe2a2d50dfc3d0226b1d&width=708&height=456&focal=2100,1390'],
  ['Pimentão', 'Legumes', 'kg', 7.49, null, 20, 'https://s2.glbimg.com/DV0BJoVaIEax1qzAhCWwNWOk158=/620x466/smart/e.glbimg.com/og/ed/f/original/2021/04/14/como-plantar-pimentao-em-casa-getty-images-1.jpg'],
  ['Cenoura', 'Legumes', 'kg', 5.99, 4.49, 40, U + 'photo-1447175008436-054170c2e979' + q],
  ['Limão', 'Frutas', 'kg', 4.79, 3.79, 35, 'https://img.drogaraia.com.br/uploads/2024/04/adobestock_8188882_easy-resize-c.jpg'],
  ['Manga', 'Frutas', 'kg', 7.49, null, 18, U + 'photo-1553279768-865429fa0078' + q],
  ['Ervilha', 'Legumes', 'pacote', 6.19, null, 0, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-ZBlaXW3ltuaIrXTICxLyV5LC8Igdrup2mBFPOKmiFw&s=10'],
  ['Rúcula', 'Verduras', 'maço', 4.29, null, 22, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVMQZpgBDno8Qke8hZVkLngyUg1uH_5WOpsLsdyAG4wQ&s=10'],
  ['Pão de Forma', 'Mercearia', 'pacote', 6.99, null, 15, 'https://cdn.awsli.com.br/600x700/2738/2738802/produto/285843036/forma-tradidional-1-3cdu1vu0sr.png'],
  ['Pão Francês', 'Mercearia', 'kg', 4.99, null, 30, 'https://www.redchameleon.com.br/storage/images/cache/forno-turbo-pao-de-sal-crocante-1280-fb6adcfa.jpg'],
  ['Pão de Queijo', 'Laticínios', 'pacote', 7.99, null, 14, 'https://static.itdg.com.br/images/640-400/dfc5a3f918dc30f32747b44cd3a18712/pao-de-queijo-facil-e-delicioso-3-.jpg'],
  ['Leite Integral', 'Laticínios', 'un', 4.49, null, 48, 'https://assets.ibecom.com.br/ib.item.image.large/l-c54acdc6d1da4f50a37252efe847bbd7.jpeg'],
  ['Queijo Prato', 'Laticínios', 'pacote', 19.99, null, 10, 'https://images.tcdn.com.br/img/img_prod/1049139/queijo_prato_fatiado_150g_d_or_603_1_d9a6770e63d8bc4319f8a61771adfb1d.jpg'],
  ['Presunto', 'Laticínios', 'pacote', 3.49, null, 16, 'https://vitat.com.br/wp-content/uploads/2023/04/tipos-de-presunto-scaled.jpg']
];

const centavos = v => Math.round(v * 100);

function proximoDomingo() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

function seedSeVazio(db) {
  if (db.prepare('SELECT COUNT(*) n FROM produtos').get().n > 0) return false;
  const ate = proximoDomingo();
  const ins = db.prepare(`INSERT INTO produtos
    (nome, categoria, unidade, preco_centavos, promo_centavos, promo_ate, estoque, estoque_minimo, imagem)
    VALUES (?,?,?,?,?,?,?,?,?)`);
  const mov = db.prepare(`INSERT INTO movimentos (produto_id, tipo, quantidade, estoque_apos, motivo, usuario)
    VALUES (?, 'inicial', ?, ?, 'Estoque inicial', 'sistema')`);
  db.transaction(() => {
    for (const [nome, cat, un, preco, promo, estoque, img] of PRODUTOS) {
      const r = ins.run(nome, cat, un, centavos(preco), promo ? centavos(promo) : null, promo ? ate : null, estoque, 5, img);
      mov.run(r.lastInsertRowid, estoque, estoque);
    }
  })();
  return true;
}

module.exports = { seedSeVazio };
