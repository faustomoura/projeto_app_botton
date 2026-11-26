const upload = document.getElementById('upload');
const previewImg = document.getElementById('preview-img');
const zoom = document.getElementById('zoom');
const posX = document.getElementById('posX');
const posY = document.getElementById('posY');
const formato = document.getElementById('formato');
const moldura = document.getElementById('moldura');
const btnFinalizar = document.getElementById('btn-finalizar');

const produto = localStorage.getItem('produto_selecionado') || 'Botton Redondo';
document.getElementById('titulo-produto').innerText = `Personalizar: ${produto}`;

// Define formato inicial baseado no produto
if (produto.toLowerCase().includes('quadrado')) {
  formato.value = 'quadrado';
  moldura.classList.remove('redondo');
  moldura.classList.add('quadrado');
} else {
  formato.value = 'redondo';
  moldura.classList.remove('quadrado');
  moldura.classList.add('redondo');
}

upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    previewImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function atualizarImagem() {
  const z = zoom.value;
  const x = posX.value;
  const y = posY.value;
  previewImg.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${z})`;
}

zoom.addEventListener('input', atualizarImagem);
posX.addEventListener('input', atualizarImagem);
posY.addEventListener('input', atualizarImagem);

formato.addEventListener('change', () => {
  moldura.classList.remove('redondo', 'quadrado');
  moldura.classList.add(formato.value);
});

btnFinalizar.addEventListener('click', async () => {
  const file = upload.files[0];
  if (!file) {
    alert('Envie uma imagem primeiro.');
    return;
  }

  const clienteNome = document.getElementById('cliente_nome').value.trim();
  const clienteTel = document.getElementById('cliente_telefone').value.trim();

  if (!clienteNome || !clienteTel) {
    alert('Preencha seu nome e telefone.');
    return;
  }

  const formData = new FormData();
  formData.append('imagem', file);
  formData.append('cliente_nome', clienteNome);
  formData.append('cliente_telefone', clienteTel);
  formData.append('barraca', document.getElementById('barraca').value);
  formData.append('produto', produto);
  formData.append('formato', formato.value);
  formData.append('tamanho', document.getElementById('tamanho').value);
  formData.append('quantidade', document.getElementById('quantidade').value);

  try {
    const res = await fetch('/api/pedidos', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (data.id) {
      alert(`Pedido enviado com sucesso! Código: #${data.id}\nAnote seu telefone para acompanhar.`);
      window.location.href = '/carrinho.html';
    } else {
      alert('Erro ao enviar pedido: ' + (data.error || 'desconhecido'));
    }
  } catch (err) {
    alert('Erro de conexão: ' + err.message);
  }
});
