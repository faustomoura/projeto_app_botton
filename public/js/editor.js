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
let imagemOriginal = null; // Guarda a imagem carregada em memória

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
// 🎯 FUNÇÃO MÁGICA: Recorta a imagem no formato/tamanho real
// =====================================================
function recortarImagem() {
  return new Promise((resolve, reject) => {
    if (!imagemOriginal) {
      reject(new Error('Nenhuma imagem carregada'));
      return;
    }

    // Tamanhos em pixels a 300 DPI (qualidade de impressão)
    const tamanhos = {
      '3x3': 354,     // 3,0 cm
      '3.5x3.5': 413, // 3,5 cm
      '4x4': 472,     // 4,0 cm
      '5x5': 591      // 5,0 cm
    };

    const tamanhoSelecionado = document.getElementById('tamanho').value;
    const tamanhoPx = tamanhos[tamanhoSelecionado] || 354;
    const formatoSelecionado = formato.value;

    // Criar canvas do tamanho real do produto
    const canvas = document.createElement('canvas');
    canvas.width = tamanhoPx;
    canvas.height = tamanhoPx;
    const ctx = canvas.getContext('2d');

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, tamanhoPx, tamanhoPx);

    // Se for redondo, criar máscara circular
    if (formatoSelecionado === 'redondo') {
      ctx.beginPath();
      ctx.arc(tamanhoPx / 2, tamanhoPx / 2, tamanhoPx / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    // Calcular como a imagem aparece na moldura (350x350px na tela)
    const molduraSize = 350;
    const img = imagemOriginal;

    // Escala da imagem para caber na moldura (contain)
    const scaleToFit = Math.min(molduraSize / img.width, molduraSize / img.height);
    const imgDisplayWidth = img.width * scaleToFit;
    const imgDisplayHeight = img.height * scaleToFit;

    // Posição da imagem na moldura (centralizada + offset do usuário)
    const imgX = (molduraSize - imgDisplayWidth) / 2 + imageState.x;
    const imgY = (molduraSize - imgDisplayHeight) / 2 + imageState.y;

    // Fator de escala entre a moldura (350px) e o canvas real
    const factor = tamanhoPx / molduraSize;
    const finalScale = scaleToFit * imageState.scale * factor;

    // Desenhar imagem no canvas com as transformações aplicadas
    const drawWidth = img.width * finalScale;
    const drawHeight = img.height * finalScale;
    const drawX = (tamanhoPx - drawWidth) / 2 + imageState.x * factor;
    const drawY = (tamanhoPx - drawHeight) / 2 + imageState.y * factor;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Converter para Blob e resolver
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], 'boton.png', { type: 'image/png' }));
      } else {
        reject(new Error('Erro ao gerar imagem'));
      }
    }, 'image/png', 0.95);
  });
}

// FINALIZAR PEDIDO - agora envia a imagem recortada
btnFinalizar.addEventListener('click', async () => {
  const file = upload.files[0];
  if (!file) { alert('Envie uma imagem primeiro.'); return; }
  const clienteNome = document.getElementById('cliente_nome').value.trim();
  const clienteTel = document.getElementById('cliente_telefone').value.trim();
  if (!clienteNome || !clienteTel) { alert('Preencha nome e telefone.'); return; }

  btnFinalizar.disabled = true;
  btnFinalizar.innerText = '⏳ Processando...';

  try {
    // Recortar a imagem no formato/tamanho real
    const imagemRecortada = await recortarImagem();

    const formData = new FormData();
    formData.append('imagem', imagemRecortada); // Envia a imagem JÁ RECORTADA
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
