const upload = document.getElementById('upload');
const previewImg = document.getElementById('preview-img');
const formato = document.getElementById('formato');
const moldura = document.getElementById('moldura');
const btnFinalizar = document.getElementById('btn-finalizar');
const btnReset = document.getElementById('btn-reset');
const zoomSlider = document.getElementById('zoom-slider');

const produto = localStorage.getItem('produto_selecionado') || 'Botton Redondo';
document.getElementById('titulo-produto').innerText = `Personalizar: ${produto}`;

if (produto.toLowerCase().includes('quadrado')) {
  formato.value = 'quadrado';
  moldura.classList.remove('redondo');
  moldura.classList.add('quadrado');
} else {
  formato.value = 'redondo';
  moldura.classList.remove('quadrado');
  moldura.classList.add('redondo');
}

let imageState = { x: 0, y: 0, scale: 1, isDragging: false, startX: 0, startY: 0 };
let imagemOriginal = null;

upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      imagemOriginal = img;
      previewImg.src = event.target.result;
      imageState = { x: 0, y: 0, scale: 1, isDragging: false, startX: 0, startY: 0 };
      zoomSlider.value = 1;
      atualizarTransform();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function atualizarTransform() {
  previewImg.style.transform = `translate(${imageState.x}px, ${imageState.y}px) scale(${imageState.scale})`;
}

// DRAG - Mouse
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

document.addEventListener('mouseup', () => { imageState.isDragging = false; });

// DRAG - Touch
moldura.addEventListener('touchstart', (e) => {
  if (!previewImg.src || e.touches.length !== 1) return;
  const touch = e.touches[0];
  imageState.isDragging = true;
  imageState.startX = touch.clientX - imageState.x;
  imageState.startY = touch.clientY - imageState.y;
}, { passive: true });

moldura.addEventListener('touchmove', (e) => {
  if (!imageState.isDragging || e.touches.length !== 1) return;
  const touch = e.touches[0];
  imageState.x = touch.clientX - imageState.startX;
  imageState.y = touch.clientY - imageState.startY;
  atualizarTransform();
}, { passive: true });

moldura.addEventListener('touchend', () => { imageState.isDragging = false; });

// ZOOM - Scroll
moldura.addEventListener('wheel', (e) => {
  if (!previewImg.src) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? -0.1 : 0.1;
  imageState.scale = Math.max(0.3, Math.min(5, imageState.scale + delta));
  zoomSlider.value = imageState.scale;
  atualizarTransform();
}, { passive: false });

zoomSlider.addEventListener('input', (e) => {
  imageState.scale = parseFloat(e.target.value);
  atualizarTransform();
});

btnReset.addEventListener('click', () => {
  imageState.x = 0;
  imageState.y = 0;
  imageState.scale = 1;
  zoomSlider.value = 1;
  atualizarTransform();
});

formato.addEventListener('change', () => {
  moldura.classList.remove('redondo', 'quadrado');
  moldura.classList.add(formato.value);
});

// =====================================================
// 🎯 RECORTAR IMAGEM - LÓGICA CORRIGIDA
// =====================================================
function recortarImagem() {
  return new Promise((resolve, reject) => {
    if (!imagemOriginal) {
      reject(new Error('Nenhuma imagem carregada'));
      return;
    }

    // Tamanhos em pixels a 300 DPI
    const tamanhos = {
      '3x3': 354,
      '3.5x3.5': 413,
      '4x4': 472,
      '5x5': 591
    };

    const tamanhoSelecionado = document.getElementById('tamanho').value;
    const tamanhoFinal = tamanhos[tamanhoSelecionado] || 354;
    const formatoSelecionado = formato.value;

    const MOLDURA_PX = 350; // Tamanho da moldura na tela
    const img = imagemOriginal;

    // 1. Calcular como a imagem é exibida na moldura (object-fit: contain)
    const scaleToFit = Math.min(MOLDURA_PX / img.width, MOLDURA_PX / img.height);
    const imgDisplayW = img.width * scaleToFit;
    const imgDisplayH = img.height * scaleToFit;

    // 2. Posição inicial (centralizada na moldura)
    const imgCenterX = MOLDURA_PX / 2;
    const imgCenterY = MOLDURA_PX / 2;

    // 3. Criar canvas do tamanho final
    const canvas = document.createElement('canvas');
    canvas.width = tamanhoFinal;
    canvas.height = tamanhoFinal;
    const ctx = canvas.getContext('2d');

    // 4. Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tamanhoFinal, tamanhoFinal);

    // 5. Máscara circular se for redondo
    if (formatoSelecionado === 'redondo') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(tamanhoFinal / 2, tamanhoFinal / 2, tamanhoFinal / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // 6. Fator de escala: moldura (350px) → canvas final
    const fator = tamanhoFinal / MOLDURA_PX;

    // 7. Desenhar imagem no canvas
    // A imagem na moldura tem tamanho imgDisplayW x imgDisplayH
    // No canvas final, esse tamanho é multiplicado pelo fator
    const finalImgW = imgDisplayW * fator;
    const finalImgH = imgDisplayH * fator;

    // Centro da imagem no canvas (antes do translate do usuário)
    const centerX = tamanhoFinal / 2;
    const centerY = tamanhoFinal / 2;

    // Posição da imagem no canvas (centralizada + offset do usuário * fator)
    const drawX = centerX - finalImgW / 2 + imageState.x * fator;
    const drawY = centerY - finalImgH / 2 + imageState.y * fator;

    // Escala final aplicada ao zoom do usuário
    const finalScale = imageState.scale;

    // Desenhar a imagem
    ctx.drawImage(
      img,
      drawX,
      drawY,
      finalImgW * finalScale,
      finalImgH * finalScale
    );

    if (formatoSelecionado === 'redondo') {
      ctx.restore();
    }

    // 8. Converter para File
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'boton.png', { type: 'image/png' }));
      } else {
        reject(new Error('Erro ao gerar imagem'));
      }
    }, 'image/png', 0.95);
  });
}

// FINALIZAR PEDIDO
btnFinalizar.addEventListener('click', async () => {
  const file = upload.files[0];
  if (!file) { alert('Envie uma imagem primeiro.'); return; }
  const clienteNome = document.getElementById('cliente_nome').value.trim();
  const clienteTel = document.getElementById('cliente_telefone').value.trim();
  if (!clienteNome || !clienteTel) { alert('Preencha nome e telefone.'); return; }

  btnFinalizar.disabled = true;
  btnFinalizar.innerText = '⏳ Processando...';

  try {
    const imagemRecortada = await recortarImagem();

    const formData = new FormData();
    formData.append('imagem', imagemRecortada);
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
  } catch (err) {
    alert('Erro ao processar: ' + err.message);
  } finally {
    btnFinalizar.disabled = false;
    btnFinalizar.innerText = '✅ Finalizar Pedido';
  }
});
