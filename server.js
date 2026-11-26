const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// 🔑 Rota explícita para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Servir uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ROTA: Criar pedido
app.post('/api/pedidos', upload.single('imagem'), (req, res) => {
  const { cliente_nome, cliente_telefone, barraca, produto, formato, tamanho, quantidade } = req.body;
  const imagem = req.file ? req.file.filename : null;

  db.run(
    `INSERT INTO pedidos (cliente_nome, cliente_telefone, barraca, produto, formato, tamanho, quantidade, imagem)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [cliente_nome, cliente_telefone, barraca, produto, formato, tamanho, quantidade, imagem],
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

// ROTA: Excluir pedido
app.delete('/api/pedidos/:id', (req, res) => {
  db.get(`SELECT imagem FROM pedidos WHERE id = ?`, [req.params.id], (err, row) => {
    if (row && row.imagem) {
      const imgPath = path.join(uploadsDir, row.imagem);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    db.run(`DELETE FROM pedidos WHERE id = ?`, [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Pedido excluído' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📁 Pasta uploads: ${uploadsDir}`);
});
