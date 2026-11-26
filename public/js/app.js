function escolherProduto(produto) {
  localStorage.setItem('produto_selecionado', produto);
  window.location.href = '/personalizar.html';
}
