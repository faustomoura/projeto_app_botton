const upload = document.getElementById('upload');
const previewImg = document.getElementById('preview-img');
const formato = document.getElementById('formato');
const moldura = document.getElementById('moldura');
const btnFinalizar = document.getElementById('btn-finalizar');

const produto = localStorage.getItem('produto_selecionado') || 'Botton Redondo';
document.getElementById('titulo-produto').innerText = `Personalizar: ${produto}`;

// Define formato inicial
if (produto.toLowerCase().includes('quadrado')) {
  formato.value = 'quadrado';
  moldura.classList.remove('redondo');
  moldura.classList.add('quadrado');
} else {
  formato.value = 'redondo';
  moldura.classList.remove('quadrado');
  moldura.classList.add('redondo');
}

// Estado da imagem
let imageState = {
  x: 0,
  y: 0,
  scale: 1,
  isDragging: false,
  startX: 0,
  startY: 0,
  initialX: 0,
  initialY: 0
};

// Carregar imagem
upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewImg.src = event.target.result;
    // Reset posição ao carregar nova imagem
    imageState = { x: 0, y: 0, scale: 1, isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 };
    atualizarTransform();
  };
  reader.readAsDataURL(file);
});

// Atualizar transformação da imagem
function atualizarTransform() {
  previewImg.style.transform = `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale})`;
}

// ========== DRAG & DROP (Mouse) ==========
moldura.addEventListener('mousedown', (e) => {
  if (!previewImg.src) return;
  imageState.isDragging = true;
  imageState.startX = e.clientX - imageState.x;
  imageState.startY = e.clientY - imageState.y;
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!imageState.isDragging) return;
  e.preventDefault();
  imageState.x = e.clientX - imageState.startX;
  imageState.y = e.clientY - imageState.startY;
  atualizarTransform();
});

document.addEventListener('mouseup', () => {
  imageState.isDragging = false;
});

// ========== DRAG & DROP (Touch - Mobile) ==========
moldura.addEventListener('touchstart', (e) => {
  if (!previewImg.src) return;
  const touch = e.touches[0];
  imageState.isDragging = true;
  imageState.startX = touch.clientX - imageState.x;
  imageState.startY = touch.clientY - imageState.y;
}, { passive: true });

moldura.addEventListener('touchmove', (e) => {
  if (!imageState.isDragging) return;
  const touch = e.touches[0];
  imageState.x = touch.clientX - imageState.startX;
  imageState.y = touch.clientY - imageState.startY;
  atualizarTransform();
}, { passive: true });

moldura.addEventListener('touchend', () => {
  imageState.isDragging = false;
});

// ========== ZOOM (Scroll do mouse) ==========
moldura.addEventListener('wheel', (e) => {
  if (!previewImg.src) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  imageState.scale = Math.max(0.3, Math.min(5, imageState.scale + delta));
  atualizarTransform();
}, { passive: false });

// ========== ZOOM (Pinch - Mobile) ==========
let initialPinchDistance = 0;
let initialScale = 1;

moldura.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    initialPinchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialScale = imageState.scale;
  }
}, { passive: true });

moldura.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const scale = initialScale * (currentDistance / initialPinchDistance);
    imageState.scale = Math.max(0.3, Math.min(5, scale));
    atualizarTransform();
  }
}, { passive: false });

// ========== CONTROLES MANUAIS (opcional) ==========
// Botões de zoom fino
function criarControlesZoom() {
  const controles = document.querySelector('.controles');
  
  const zoomLabel = document.createElement('label');
  zoomLabel.innerText = 'Zoom:';
  controles.appendChild(zoomLabel);
  
  const zoomSlider = document.createElement('input');
  zoomSlider.type = 'range';
  zoomSlider.min = '0.3';
  zoomSlider.max = '5';
  zoomSlider.step = '0.1';
  zoomSlider.value = '1';
  zoomSlider.addEventListener('input', (e) => {
    imageState.scale = parseFloat(e.target.value);
    atualizarTransform();
  });
  controles.appendChild(zoomSlider);
  
  const resetBtn = document.createElement('button');
  resetBtn.innerText = '🔄 Resetar Posição';
  resetBtn.style.marginTop = '10px';
  resetBtn.style.background = '#64748b';
  resetBtn.addEventListener('click', () => {
    imageState.x = 0;
    imageState.y = 0;
    imageState.scale = 1;
    zoomSlider.value = '1';
    atualizarTransform();
  });
  controles.appendChild(resetBtn);
}

criarControlesZoom();

// Formato
formato.addEventListener('change', () => {
  moldura.classList.remove('redondo', 'quadrado');
  moldura.classList.add(formato.value);
});

// Finalizar pedido
btnFinalizar.addEventListener('click', async () => {
  const file = upload.files[0];
  if (!file) { alert('Envie uma imagem primeiro.'); return; }
  const clienteNome = document.getElementById('cliente_nome').value.trim();
  const clienteTel = document.getElementById('cliente_telefone').value.trim();
  if (!clienteNome || !clienteTel) { alert('Preencha nome e telefone.'); return; }

  const formData = new FormData();
  formData.append('imagem', file);
  formData.append('cliente_nome', clienteNome);
  formData.append('cliente_telefone', clienteTel);
  formData.append('barraca', document.getElementById('barraca').value);
  formData.append('produto', produto);
  formData.append('formato', formato.value);
  formData.append('tamanho', document.getElementById('tamanho').value);
  formData.append('quantidade', document.getElementById('quantidade').value);

  const res = await fetch('/api/pedidos', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.id) {
    alert(`Pedido enviado! Código: #${data.id}`);
    window.location.href = '/carrinho.html';
  } else {
    alert('Erro: ' + (data.error || 'desconhecido'));
  }
});
