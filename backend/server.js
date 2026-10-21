const express = require('express');
const cors = require('cors');
const pool = require('./database.js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Obtener todos los productos del mercado
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM products ORDER BY id DESC");
    // pg retorna NUMERIC como string, parseamos a Float para no romper el frontend
    const parsedRows = rows.map(r => ({ ...r, price: parseFloat(r.price) }));
    res.json(parsedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los lotes (historial del productor)
app.get('/api/lotes', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM lotes ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar un nuevo lote en la blockchain (simulado) y guardar en BD
app.post('/api/lotes', async (req, res) => {
  const { cultivo, cantidad, precio, gps, tipoVenta, fechaEstimada, img } = req.body;
  const nombreLote = `${cultivo} (${tipoVenta})`;
  const volumen = `${cantidad} KG`;
  const fakeHash = "0x" + Math.random().toString(16).substr(2, 8);
  const status = 'Fondos Bloqueados';

  try {
    // 1. Guardar en el Historial del Productor (lotes)
    const { rows: loteRows } = await pool.query(
      `INSERT INTO lotes (cultivo, volumen, hash, status) VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombreLote, volumen, fakeHash, status]
    );

    const loteGuardado = {
      id: loteRows[0].id,
      cultivo: nombreLote,
      volumen,
      hash: fakeHash,
      status
    };

    // 2. Guardar automáticamente en el Mercado (products)
    const type = tipoVenta.toLowerCase();
    const fundo = 'Fundo Productor Local';
    const rating = '0.0'; // Nuevas publicaciones empiezan sin estrellas
    const category = 'frutas';
    const productImage = img || '/palta.png'; 

    await pool.query(
      `INSERT INTO products (name, fundo, type, location, harvestDate, rating, lot, price, category, img) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [cultivo, fundo, type, gps || 'Desconocida', fechaEstimada || 'Reciente', rating, parseInt(cantidad) || 0, parseFloat(precio) || 0, category, productImage]
    );

    res.json(loteGuardado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un producto del mercado y su historial en lotes
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Buscar el producto para saber su nombre y tipo
    const { rows } = await pool.query('SELECT name, type FROM products WHERE id = $1', [id]);
    
    if (rows.length > 0) {
      const prod = rows[0];
      const tipoCapitalizado = prod.type.charAt(0).toUpperCase() + prod.type.slice(1);
      const nombreLote = `${prod.name} (${tipoCapitalizado})`;
      
      // 2. Borrar del historial (lotes) buscando por el nombre compuesto (solo 1 para no borrar repetidos)
      await pool.query('DELETE FROM lotes WHERE id IN (SELECT id FROM lotes WHERE cultivo = $1 LIMIT 1)', [nombreLote]);
    }
    
    // 3. Borrar del mercado (products)
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Producto eliminado de Mercado e Historial' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guardar nueva compra / boleta en Neon PostgreSQL
app.post('/api/orders', async (req, res) => {
  const {
    txHash,
    buyerWallet,
    sellerWallet,
    items,
    totalAmount,
    currency,
    network,
    networkKey,
    explorerUrl,
    concept,
    status
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO orders (tx_hash, buyer_wallet, seller_wallet, items, total_amount, currency, network, network_key, explorer_url, concept, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        txHash,
        buyerWallet || null,
        sellerWallet || '0xfad3E2f30896bf812CF779730d25018B46BE4C32',
        JSON.stringify(items || []),
        parseFloat(totalAmount) || 0,
        currency || 'ETH',
        network || 'Ethereum',
        networkKey || 'sepolia',
        explorerUrl || null,
        concept || 'Compra de productos agrícolas',
        status || 'confirmed'
      ]
    );

    // Registrar también en la tabla lotes para que el Productor lo vea en su historial
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await pool.query(
          `INSERT INTO lotes (cultivo, volumen, hash, status) VALUES ($1, $2, $3, $4)`,
          [`Venta: ${item.nombre}`, `${item.cantidad} KG`, txHash, 'Pagado']
        );
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error guardando orden en BD:", err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener todas las órdenes / historial de compras
app.get('/api/orders', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener la última orden realizada (para boleta / receipt)
app.get('/api/orders/latest', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY id DESC LIMIT 1");
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "No orders found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
