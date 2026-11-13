const listaAnimaisEl = document.getElementById('lista-animais');
const estadoListaEl = document.getElementById('estado-lista');
const filtroEspecie = document.getElementById('filtro-especie');
const filtroPorte = document.getElementById('filtro-porte');
const filtroBusca = document.getElementById('filtro-busca');
const chkAdotados = document.getElementById('chk-adotados');

const modalVisitante = document.getElementById('modal-visitante');
const formVisitante = document.getElementById('form-visitante');
const inputVisitanteNome = document.getElementById('visitante-nome');
const inputVisitanteBairro = document.getElementById('visitante-bairro');
const erroVisitante = document.getElementById('erro-visitante');
const nomeVisitanteTopo = document.getElementById('nome-visitante-topo');
const btnTrocarVisitante = document.getElementById('btn-trocar-visitante');

const modalAdocao = document.getElementById('modal-adocao');
const btnFecharAdocao = document.getElementById('btn-fechar-adocao');
const formAdocao = document.getElementById('form-adocao');
const msgAdocao = document.getElementById('msg-adocao');

let animaisCache = [];

function aplicarPreferenciasAcessibilidade() {
  const tamanhoSalvo = localStorage.getItem('portal_fonte_px');
  if (tamanhoSalvo) {
    document.documentElement.style.setProperty('--fonte-base', tamanhoSalvo + 'px');
  }

  const contrasteSalvo = localStorage.getItem('portal_alto_contraste') === '1';
  document.body.classList.toggle('alto-contraste', contrasteSalvo);
  document.getElementById('btn-contraste').setAttribute('aria-pressed', String(contrasteSalvo));
}

function configurarAcessibilidade() {
  aplicarPreferenciasAcessibilidade();

  document.getElementById('btn-aumentar').addEventListener('click', () => {
    const atual = parseInt(getComputedStyle(document.documentElement).fontSize, 10) || 16;
    const novo = Math.min(atual + 2, 22);
    document.documentElement.style.setProperty('--fonte-base', novo + 'px');
    localStorage.setItem('portal_fonte_px', String(novo));
  });

  document.getElementById('btn-diminuir').addEventListener('click', () => {
    const atual = parseInt(getComputedStyle(document.documentElement).fontSize, 10) || 16;
    const novo = Math.max(atual - 2, 13);
    document.documentElement.style.setProperty('--fonte-base', novo + 'px');
    localStorage.setItem('portal_fonte_px', String(novo));
  });

  const btnContraste = document.getElementById('btn-contraste');
  btnContraste.addEventListener('click', () => {
    const ativo = document.body.classList.toggle('alto-contraste');
    btnContraste.setAttribute('aria-pressed', String(ativo));
    localStorage.setItem('portal_alto_contraste', ativo ? '1' : '0');
  });
}

async function registrarLogAcesso(usuarioNome, acao, animalNome = null) {
  const bairro = sessionStorage.getItem('visitante_bairro') || null;
  try {
    await db.from('logs_acesso').insert({
      usuario_nome: usuarioNome,
      bairro: bairro,
      acao: acao,
      animal_nome: animalNome
    });
  } catch (err) {
    console.error('Falha ao gravar log:', err);
  }
}

function atualizarCabecalhoVisitante() {
  const nome = sessionStorage.getItem('visitante_nome');
  if (nome) {
    nomeVisitanteTopo.textContent = 'Visitante: ' + nome;
    modalVisitante.hidden = true;
  } else {
    nomeVisitanteTopo.textContent = 'Visitante não identificado';
    modalVisitante.hidden = false;
    inputVisitanteNome.focus();
  }
}

formVisitante.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroVisitante.textContent = '';

  const nome = inputVisitanteNome.value.trim();
  const bairro = inputVisitanteBairro.value.trim();

  if (nome.length < 2) {
    erroVisitante.textContent = 'Digite seu nome com pelo menos 2 caracteres.';
    inputVisitanteNome.focus();
    return;
  }

  sessionStorage.setItem('visitante_nome', nome);
  sessionStorage.setItem('visitante_bairro', bairro);

  await registrarLogAcesso(nome, 'Acesso ao portal');
  atualizarCabecalhoVisitante();
});

btnTrocarVisitante.addEventListener('click', () => {
  inputVisitanteNome.value = sessionStorage.getItem('visitante_nome') || '';
  inputVisitanteBairro.value = sessionStorage.getItem('visitante_bairro') || '';
  erroVisitante.textContent = '';
  modalVisitante.hidden = false;
  inputVisitanteNome.focus();
});

async function carregarAnimais() {
  estadoListaEl.textContent = 'Carregando animais...';
  const { data, error } = await db
    .from('animais')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    estadoListaEl.textContent = 'Não foi possível carregar os animais no momento.';
    console.error(error);
    return;
  }

  animaisCache = data || [];
  renderizarAnimais();
}

function traduzirStatus(status) {
  if (status === 'em_analise') return 'Em análise';
  if (status === 'adotado') return 'Adotado';
  return 'Disponível';
}

function renderizarAnimais() {
  const especie = filtroEspecie.value;
  const porte = filtroPorte.value;
  const busca = filtroBusca.value.trim().toLowerCase();
  const mostrarAdotados = chkAdotados.checked;

  const filtrados = animaisCache.filter((pet) => {
    if (!mostrarAdotados && pet.status === 'adotado') return false;
    if (especie && pet.especie !== especie) return false;
    if (porte && pet.porte !== porte) return false;
    if (busca) {
      const texto = (pet.nome + ' ' + pet.bairro + ' ' + pet.descricao).toLowerCase();
      if (!texto.includes(busca)) return false;
    }
    return true;
  });

  listaAnimaisEl.innerHTML = '';

  if (filtrados.length === 0) {
    estadoListaEl.textContent = 'Nenhum animal encontrado com os filtros selecionados.';
    return;
  }

  estadoListaEl.textContent = filtrados.length + (filtrados.length === 1 ? ' animal encontrado' : ' animais encontrados');

  filtrados.forEach((pet) => {
    const card = document.createElement('article');
    card.className = 'cartao-pet';

    const img = document.createElement('img');
    img.src = pet.foto_url;
    img.alt = 'Foto de ' + pet.nome + ', ' + pet.especie + ' porte ' + pet.porte;
    img.loading = 'lazy';

    const corpo = document.createElement('div');
    corpo.className = 'cartao-corpo';

    const topo = document.createElement('div');
    topo.className = 'cartao-topo';

    const titulo = document.createElement('h3');
    titulo.textContent = pet.nome;

    const selo = document.createElement('span');
    selo.className = 'selo selo-' + pet.status;
    selo.textContent = traduzirStatus(pet.status);

    topo.appendChild(titulo);
    topo.appendChild(selo);

    const meta = document.createElement('p');
    meta.className = 'pet-meta';
    meta.textContent = `${pet.especie} · ${pet.porte} · ${pet.idade} · ${pet.bairro}`;

    const resumo = document.createElement('p');
    resumo.className = 'pet-resumo';
    resumo.textContent = pet.descricao.length > 105 ? pet.descricao.slice(0, 105) + '...' : pet.descricao;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = pet.status === 'adotado' ? 'btn-secundario' : 'btn-primario';
    btn.textContent = pet.status === 'adotado' ? 'Ver perfil' : 'Quero adotar';
    btn.addEventListener('click', () => abrirModalAdocao(pet));

    corpo.appendChild(topo);
    corpo.appendChild(meta);
    corpo.appendChild(resumo);
    corpo.appendChild(btn);

    card.appendChild(img);
    card.appendChild(corpo);
    listaAnimaisEl.appendChild(card);
  });
}

function abrirModalAdocao(pet) {
  document.getElementById('detalhe-foto').src = pet.foto_url;
  document.getElementById('detalhe-foto').alt = 'Foto de ' + pet.nome;
  document.getElementById('detalhe-nome').textContent = pet.nome;

  const extras = [
    pet.especie,
    'Porte ' + pet.porte,
    pet.sexo,
    pet.idade,
    pet.castrado ? 'Castrado' : 'Não castrado',
    pet.vacinado ? 'Vacinado' : 'Sem vacina informada',
    pet.bairro
  ];
  document.getElementById('detalhe-info').textContent = extras.join(' · ');
  document.getElementById('detalhe-descricao').textContent = pet.descricao;

  document.getElementById('adocao-animal-id').value = pet.id;
  document.getElementById('adocao-animal-nome').value = pet.nome;

  const nomeVisitante = sessionStorage.getItem('visitante_nome') || '';
  const campoNome = document.getElementById('adocao-nome');
  if (!campoNome.value && nomeVisitante) {
    campoNome.value = nomeVisitante;
  }

  msgAdocao.textContent = '';
  msgAdocao.className = 'msg-status';

  const btnEnviar = formAdocao.querySelector('button[type="submit"]');
  btnEnviar.disabled = pet.status === 'adotado';
  btnEnviar.textContent = pet.status === 'adotado' ? 'Animal já adotado' : 'Enviar solicitação';

  modalAdocao.hidden = false;

  if (nomeVisitante) {
    registrarLogAcesso(nomeVisitante, 'Visualizou perfil do animal', pet.nome);
  }
}

btnFecharAdocao.addEventListener('click', () => {
  modalAdocao.hidden = true;
});

modalAdocao.addEventListener('click', (e) => {
  if (e.target === modalAdocao) {
    modalAdocao.hidden = true;
  }
});

formAdocao.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgAdocao.textContent = '';
  msgAdocao.className = 'msg-status';

  const animalId = document.getElementById('adocao-animal-id').value;
  const animalNome = document.getElementById('adocao-animal-nome').value;
  const nome = document.getElementById('adocao-nome').value.trim();
  const telefone = document.getElementById('adocao-telefone').value.trim();
  const moradia = document.getElementById('adocao-moradia').value;
  const mensagem = document.getElementById('adocao-mensagem').value.trim();

  const apenasDigitos = telefone.replace(/\D/g, '');
  if (nome.length < 3) {
    msgAdocao.textContent = 'Informe seu nome completo.';
    msgAdocao.classList.add('erro');
    return;
  }
  if (apenasDigitos.length < 10) {
    msgAdocao.textContent = 'Informe um WhatsApp válido com DDD.';
    msgAdocao.classList.add('erro');
    return;
  }
  if (!moradia) {
    msgAdocao.textContent = 'Selecione o tipo de moradia.';
    msgAdocao.classList.add('erro');
    return;
  }

  const btn = formAdocao.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const { error } = await db.from('solicitacoes_adocao').insert({
    animal_id: animalId,
    animal_nome: animalNome,
    interessado_nome: nome,
    telefone: telefone,
    moradia: moradia,
    mensagem: mensagem
  });

  btn.disabled = false;
  btn.textContent = 'Enviar solicitação';

  if (error) {
    msgAdocao.textContent = 'Erro ao enviar solicitação. Tente novamente.';
    msgAdocao.classList.add('erro');
    console.error(error);
    return;
  }

  await registrarLogAcesso(nome, 'Enviou solicitação de adoção', animalNome);

  formAdocao.reset();
  msgAdocao.textContent = 'Solicitação registrada! A equipe da ONG entrará em contato pelo WhatsApp.';
  msgAdocao.classList.add('ok');
});

[filtroEspecie, filtroPorte, chkAdotados].forEach((el) => {
  el.addEventListener('change', renderizarAnimais);
});
filtroBusca.addEventListener('input', renderizarAnimais);

document.getElementById('link-avaliacao').addEventListener('click', () => {
  const nome = sessionStorage.getItem('visitante_nome');
  if (nome) {
    registrarLogAcesso(nome, 'Acessou formulário de avaliação');
  }
});

configurarAcessibilidade();
atualizarCabecalhoVisitante();
carregarAnimais();