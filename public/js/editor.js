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
// 🎯 RECORTAR IMAGEM - ABORDAGEM DEFINITIVA
// =====================================================
function recortarImagem() {
  return new Promise((resolve, reject) => {
    if (!imagemOriginal) {
      reject(new Error('Nenhuma imagem carregada'));
      return;
    }

    const tamanhos = {
      '3x3': 354,
      '3.5x3.5': 413,
      '4x4': 472,
      '5x5': 591
    };

    const tamanhoFinal = tamanhos[document.getElementById('tamanho').value] || 354;
    const formatoSelecionado = formato.value;
    const MOLDURA = 350;
    const img = imagemOriginal;

    // =====================================================
    // PASSO 1: Calcular como a imagem aparece na moldura (object-fit: contain)
    // =====================================================
    const scaleToFit = Math.min(MOLDURA / img.width, MOLDURA / img.height);
    const displayW = img.width * scaleToFit;   // largura exibida na moldura
    const displayH = img.height * scaleToFit;  // altura exibida na moldura

    // =====================================================
    // PASSO 2: Criar canvas do tamanho FINAL do produto
    // =====================================================
    const canvas = document.createElement('canvas');
    canvas.width = tamanhoFinal;
    canvas.height = tamanhoFinal;
    const ctx = canvas.getContext('2d');

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tamanhoFinal, tamanhoFinal);

    // Máscara circular
    if (formatoSelecionado === 'redondo') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(tamanhoFinal / 2, tamanhoFinal / 2, tamanhoFinal / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    // =====================================================
    // PASSO 3: Calcular proporção entre canvas final e moldura
    // =====================================================
    const ratio = tamanhoFinal / MOLDURA;

    // =====================================================
    // PASSO 4: Desenhar imagem no canvas
    // A lógica: replicar EXATAMENTE o que o CSS mostra
    // =====================================================

    // Tamanho da imagem no canvas final (proporcional à moldura)
    const finalDisplayW = displayW * ratio;
    const finalDisplayH = displayH * ratio;

    // Centro do canvas
    const cx = tamanhoFinal / 2;
    const cy = tamanhoFinal / 2;

    // Posição da imagem: centralizada + offset do usuário (escalado) + zoom
    // O zoom do CSS scale() expande a partir do centro
    const scaledW = finalDisplayW * imageState.scale;
    const scaledH = finalDisplayH * imageState.scale;

    // Posição final (centralizada + offset do usuário escalado)
    const drawX = cx - scaledW / 2 + imageState.x * ratio;
    const drawY = cy - scaledH / 2 + imageState.y * ratio;

    console.log('DEBUG:', {
      imgSize: `${img.width}x${img.height}`,
      displaySize: `${displayW.toFixed(0)}x${displayH.toFixed(0)}`,
      finalSize: `${finalDisplayW.toFixed(0)}x${finalDisplayH.toFixed(0)}`,
      scaledSize: `${scaledW.toFixed(0)}x${scaledH.toFixed(0)}`,
      position: `${drawX.toFixed(0)},${drawY.toFixed(0)}`,
      userOffset: `${imageState.x},${imageState.y}`,
      scale: imageState.scale,
      ratio: ratio.toFixed(3)
    });

    ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

    if (formatoSelecionado === 'redondo') {
      ctx.restore();
    }

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
