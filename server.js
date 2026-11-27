const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
// ⚠️ Aumenta o limite para aceitar imagens em base64 (até 10 MB)
app.use(express.json({ limit: '10mb' }));

// 🔑 Rota explícita para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_nome TEXT,
    cliente_telefone TEXT,
    barraca TEXT,
    produto TEXT,
    formato TEXT,
    tamanho TEXT,
    quantidade INTEGER,
    imagem TEXT,
    status TEXT DEFAULT 'recebido',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ROTA: Criar pedido (recebe JSON com imagem em base64)
app.post('/api/pedidos', (req, res) => {
  const {
    cliente_nome,
    cliente_telefone,
    barraca,
    produto,
    formato,
    tamanho,
    quantidade,
    imagem
  } = req.body;

  // Validação mínima
  if (!cliente_nome || !cliente_telefone || !produto) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  db.run(
    `INSERT INTO pedidos (cliente_nome, cliente_telefone, barraca, produto, formato, tamanho, quantidade, imagem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [cliente_nome, cliente_telefone, barraca, produto, formato, tamanho, quantidade, imagem || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Pedido criado com sucesso' });
    }
  );
});

// ROTA: Listar pedidos
app.get('/api/pedidos', (req, res) => {
  db.all(`SELECT * FROM pedidos ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ROTA: Atualizar status
app.put('/api/pedidos/:id/status', (req, res) => {
  const { status } = req.body;
  db.run(`UPDATE pedidos SET status = ? WHERE id = ?`, [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Status atualizado' });
  });
});

// ROTA: Excluir pedido (não precisa apagar arquivo, a imagem está no banco)
app.delete('/api/pedidos/:id', (req, res) => {
  db.run(`DELETE FROM pedidos WHERE id = ?`, [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Pedido excluído' });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log('📦 Imagens salvas em base64 no banco SQLite');
});
