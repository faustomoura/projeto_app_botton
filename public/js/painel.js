async function carregarPedidos() {
  const res = await fetch('/api/pedidos');
  const pedidos = await res.json();
  const div = document.getElementById('pedidos-painel');
  if (pedidos.length === 0) {
    div.innerHTML = '<p>Nenhum pedido recebido.</p>';
    return;
  }
  div.innerHTML = pedidos.map(p => `
    <div class="pedido-card">
      <img src="/uploads/${p.imagem}" alt="Pedido">
      <div style="flex:1">
        <p><strong>Pedido #${p.id}</strong> — ${p.produto}</p>
        <p>Cliente: ${p.cliente_nome} | Tel: ${p.cliente_telefone}</p>
        <p>Formato: ${p.formato} | Tamanho: ${p.tamanho} | Qtd: ${p.quantidade}</p>
        <p>Barraca: ${p.barraca}</p>
        <p>Status: <span class="status ${p.status}">${p.status}</span></p>
      </div>
      <div>
        <select onchange="atualizarStatus(${p.id}, this.value)">
          <option value="recebido" ${p.status === 'recebido' ? 'selected' : ''}>Recebido</option>
          <option value="em_producao" ${p.status === 'em_producao' ? 'selected' : ''}>Em produção</option>
          <option value="pronto" ${p.status === 'pronto' ? 'selected' : ''}>Pronto</option>
          <option value="entregue" ${p.status === 'entregue' ? 'selected' : ''}>Entregue</option>
        </select>
        <button onclick="excluirPedido(${p.id})" class="btn-danger">Excluir</button>
      </div>
    </div>
  `).join('');
}

async function atualizarStatus(id, status) {
  await fetch(`/api/pedidos/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  carregarPedidos();
}

async function excluirPedido(id) {
  if (!confirm('Excluir pedido?')) return;
  await fetch(`/api/pedidos/${id}`, { method: 'DELETE' });
  carregarPedidos();
}

carregarPedidos();
setInterval(carregarPedidos, 10000);
