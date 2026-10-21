const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_3jsyKSi8DdUl@ep-gentle-art-b466ce3z-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL Database.');
});

pool.on('error', (err) => {
  // Manejador crítico para pools serverless de Neon: evita que Node crashee si un cliente idle se desconecta
  console.warn('Neon PostgreSQL notice (idle client reset):', err.message);
});

const initializeDatabase = async () => {
  try {
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        fundo VARCHAR(255),
        type VARCHAR(50),
        location VARCHAR(255),
        harvestDate VARCHAR(50),
        rating VARCHAR(10),
        lot INTEGER,
        price NUMERIC,
        category VARCHAR(50),
        img TEXT
      )
    `);

    // Create lotes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lotes (
        id SERIAL PRIMARY KEY,
        cultivo VARCHAR(255) NOT NULL,
        volumen VARCHAR(50),
        hash VARCHAR(255),
        status VARCHAR(50)
      )
    `);

    // Create orders table (compras, boletas y transacciones blockchain)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        tx_hash VARCHAR(255) NOT NULL,
        buyer_wallet VARCHAR(255),
        seller_wallet VARCHAR(255),
        items JSONB,
        total_amount NUMERIC,
        currency VARCHAR(50),
        network VARCHAR(100),
        network_key VARCHAR(50),
        explorer_url TEXT,
        concept TEXT,
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed products if empty
    const { rows: productRows } = await pool.query('SELECT count(*) as count FROM products');
    if (parseInt(productRows[0].count) === 0) {
      const seedProducts = [
        { name: 'Uva Quebranta', fundo: 'Fundo San Vicente', type: 'spot', location: 'Valle de Cañete', harvestDate: 'Hace 2 días', rating: '4.9', lot: 500, price: 0.0001, category: 'frutas', img: '/uva.png' },
        { name: 'Palta Hass', fundo: 'Asoc. Nuevo Imperial', type: 'spot', location: 'Nuevo Imperial', harvestDate: 'Hoy', rating: '5.0', lot: 1000, price: 0.0001, category: 'export', img: '/palta.png' },
        { name: 'Manzana Delicia', fundo: 'Fundo El Rosal', type: 'spot', location: 'San Vicente', harvestDate: 'Hace 5 días', rating: '4.7', lot: 300, price: 0.0001, category: 'frutas', img: '/manzana.png' },
        { name: 'Mango Edward (Futuro)', fundo: 'Agro Piura', type: 'futuro', location: 'Valle de San Lorenzo', harvestDate: 'En 3 meses', rating: '4.9', lot: 5000, price: 0.0001, category: 'export', img: '/mango.png' },
        { name: 'Arándano Biloxi', fundo: 'Fundo Azul', type: 'spot', location: 'Ica', harvestDate: 'Hace 3 días', rating: '5.0', lot: 250, price: 0.0001, category: 'export', img: '/arandano.png' },
        { name: 'Espárrago Verde (Futuro)', fundo: 'Fundo Esperanza', type: 'futuro', location: 'Villuri', harvestDate: 'En 2 meses', rating: '4.8', lot: 2000, price: 0.0001, category: 'export', img: '/esparrago.png' },
        { name: 'Cebolla Roja', fundo: 'Agro Arequipa', type: 'spot', location: 'Majes', harvestDate: 'Hace 6 días', rating: '4.5', lot: 2000, price: 0.0001, category: 'frutas', img: '/cebolla.png' },
        { name: 'Quinua Blanca (Futuro)', fundo: 'Cooperativa Andina', type: 'futuro', location: 'Ayacucho', harvestDate: 'En 5 meses', rating: '5.0', lot: 10000, price: 0.0001, category: 'export', img: '/quinua.png' },
        { name: 'Cacao Orgánico', fundo: 'Amazonas Bio', type: 'spot', location: 'San Martín', harvestDate: 'Hace 10 días', rating: '4.9', lot: 500, price: 0.0001, category: 'export', img: '/cacao.png' }
      ];

      for (const p of seedProducts) {
        await pool.query(
          `INSERT INTO products (name, fundo, type, location, harvestDate, rating, lot, price, category, img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [p.name, p.fundo, p.type, p.location, p.harvestDate, p.rating, p.lot, p.price, p.category, p.img]
        );
      }
      console.log("Neon: Products table seeded!");
    }

    // Seed lotes if empty
    const { rows: loteRows } = await pool.query('SELECT count(*) as count FROM lotes');
    if (parseInt(loteRows[0].count) === 0) {
      const seedLotes = [
        { cultivo: 'Palta Hass (Spot)', volumen: '500 KG', hash: '0x8f...4b2c', status: 'Pagado' },
        { cultivo: 'Uva Quebranta (Spot)', volumen: '1200 KG', hash: '0x3a...9c1f', status: 'Fondos Bloqueados' },
        { cultivo: 'Manzana Delicia (Futuro)', volumen: '300 KG', hash: '0x7c...2e8d', status: 'Pagado' },
        { cultivo: 'Limón Sutil (Spot)', volumen: '800 KG', hash: '0x1b...5a91', status: 'Fondos Bloqueados' }
      ];

      for (const l of seedLotes) {
        await pool.query(
          `INSERT INTO lotes (cultivo, volumen, hash, status) VALUES ($1, $2, $3, $4)`,
          [l.cultivo, l.volumen, l.hash, l.status]
        );
      }
      console.log("Neon: Lotes table seeded!");
    }
  } catch (err) {
    console.error('Error initializing database', err);
  }
};

initializeDatabase();

module.exports = pool;
