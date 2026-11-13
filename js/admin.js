const telaLogin = document.getElementById('tela-login');
const painelAdmin = document.getElementById('painel-admin');
const btnSair = document.getElementById('btn-sair');
const formLogin = document.getElementById('form-login');
const erroLogin = document.getElementById('erro-login');
const usuarioLogadoEl = document.getElementById('usuario-logado');

const formAnimal = document.getElementById('form-animal');
const msgAnimal = document.getElementById('msg-animal');
const listaAdminAnimais = document.getElementById('lista-admin-animais');

const listaSolicitacoes = document.getElementById('lista-solicitacoes');
const totalSolicitacoes = document.getElementById('total-solicitacoes');

const tabelaLogsCorpo = document.getElementById('tabela-logs-corpo');
const totalLogs = document.getElementById('total-logs');
const filtroLog = document.getElementById('filtro-log');

let logsCache = [];

async function verificarSessao() {
  const { data } = await db.auth.getSession();
  const sessao = data.session;

  if (sessao) {
    telaLogin.hidden = true;
    painelAdmin.hidden = false;
    btnSair.hidden = false;
    usuarioLogadoEl.textContent = sessao.user.email;
    carregarTudo();
  } else {
    telaLogin.hidden = false;
    painelAdmin.hidden = true;
    btnSair.hidden = true;
  }
}

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroLogin.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-senha').value;

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    erroLogin.textContent = 'E-mail ou senha inválidos.';
    return;
  }

  verificarSessao();
});

btnSair.addEventListener('click', async () => {
  await db.auth.signOut();
  verificarSessao();
});

document.querySelectorAll('.aba').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach((b) => b.classList.remove('ativa'));
    document.querySelectorAll('.conteudo-aba').forEach((c) => (c.hidden = true));

    btn.classList.add('ativa');
    document.getElementById('aba-' + btn.dataset.aba).hidden = false;
  });
});

async function carregarTudo() {
  await Promise.all([
    carregarAnimaisAdmin(),
    carregarSolicitacoes(),
    carregarLogs()
  ]);
}

async function enviarImagemSeHouver(arquivo) {
  if (!arquivo) return null;
  const extensao = arquivo.name.split('.').pop();
  const nomeArquivo = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + extensao;

  const { error } = await db.storage.from('animais').upload(nomeArquivo, arquivo);
  if (error) {
    throw error;
  }

  const { data } = db.storage.from('animais').getPublicUrl(nomeArquivo);
  return data.publicUrl;
}

formAnimal.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgAnimal.textContent = '';
  msgAnimal.className = 'msg-status';

  const nome = document.getElementById('pet-nome').value.trim();
  const especie = document.getElementById('pet-especie').value;
  const porte = document.getElementById('pet-porte').value;
  const sexo = document.getElementById('pet-sexo').value;
  const idade = document.getElementById('pet-idade').value.trim();
  const bairro = document.getElementById('pet-bairro').value.trim();
  const castrado = document.getElementById('pet-castrado').checked;
  const vacinado = document.getElementById('pet-vacinado').checked;
  const arquivo = document.getElementById('pet-foto-arquivo').files[0];
  let fotoUrl = document.getElementById('pet-foto-url').value.trim();
  const descricao = document.getElementById('pet-descricao').value.trim();

  if (!nome || !idade || !bairro || !descricao) {
    msgAnimal.textContent = 'Preencha todos os campos obrigatórios.';
    msgAnimal.classList.add('erro');
    return;
  }

  if (!arquivo && !fotoUrl) {
    msgAnimal.textContent = 'Envie uma foto ou informe a URL da imagem.';
    msgAnimal.classList.add('erro');
    return;
  }

  const btn = formAnimal.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  try {
    if (arquivo) {
      fotoUrl = await enviarImagemSeHouver(arquivo);
    }

    const { error } = await db.from('animais').insert({
      nome,
      especie,
      porte,
      sexo,
      idade,
      bairro,
      castrado,
      vacinado,
      foto_url: fotoUrl,
      descricao
    });

    if (error) throw error;

    formAnimal.reset();
    msgAnimal.textContent = 'Animal cadastrado com sucesso.';
    msgAnimal.classList.add('ok');
    carregarAnimaisAdmin();
  } catch (err) {
    console.error(err);
    msgAnimal.textContent = 'Erro ao salvar animal. Verifique o Storage ou os dados.';
    msgAnimal.classList.add('erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar animal';
  }
});

async function carregarAnimaisAdmin() {
  const { data, error } = await db
    .from('animais')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  listaAdminAnimais.innerHTML = '';

  if (!data || data.length === 0) {
    listaAdminAnimais.textContent = 'Nenhum animal cadastrado ainda.';
    return;
  }

  data.forEach((pet) => {
    const item = document.createElement('div');
    item.className = 'item-admin';

    const info = document.createElement('div');
    info.className = 'item-admin-info';

    const img = document.createElement('img');
    img.src = pet.foto_url;
    img.alt = pet.nome;

    const texto = document.createElement('div');
    const titulo = document.createElement('strong');
    titulo.textContent = pet.nome;
    const sub = document.createElement('div');
    sub.className = 'pet-meta';
    sub.textContent = `${pet.especie} · ${pet.porte} · ${pet.bairro}`;

    texto.appendChild(titulo);
    texto.appendChild(sub);
    info.appendChild(img);
    info.appendChild(texto);

    const acoes = document.createElement('div');
    acoes.className = 'item-admin-acoes';

    const selectStatus = document.createElement('select');
    [
      { valor: 'disponivel', rotulo: 'Disponível' },
      { valor: 'em_analise', rotulo: 'Em análise' },
      { valor: 'adotado', rotulo: 'Adotado' }
    ].forEach((op) => {
      const option = document.createElement('option');
      option.value = op.valor;
      option.textContent = op.rotulo;
      option.selected = pet.status === op.valor;
      selectStatus.appendChild(option);
    });

    selectStatus.addEventListener('change', async () => {
      await db.from('animais').update({ status: selectStatus.value }).eq('id', pet.id);
    });

    const btnExcluir = document.createElement('button');
    btnExcluir.type = 'button';
    btnExcluir.className = 'btn-perigo';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', async () => {
      if (!confirm('Remover ' + pet.nome + ' do portal?')) return;
      await db.from('animais').delete().eq('id', pet.id);
      carregarAnimaisAdmin();
    });

    acoes.appendChild(selectStatus);
    acoes.appendChild(btnExcluir);

    item.appendChild(info);
    item.appendChild(acoes);
    listaAdminAnimais.appendChild(item);
  });
}

async function carregarSolicitacoes() {
  const { data, error } = await db
    .from('solicitacoes_adocao')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const lista = data || [];
  totalSolicitacoes.textContent = String(lista.length);
  listaSolicitacoes.innerHTML = '';

  lista.forEach((sol) => {
    const tr = document.createElement('tr');
    const { data: dt, hora } = formatarDataHoraBR(sol.criado_em);

    const tdData = document.createElement('td');
    tdData.textContent = dt + ' ' + hora;

    const tdAnimal = document.createElement('td');
    tdAnimal.textContent = sol.animal_nome;

    const tdNome = document.createElement('td');
    tdNome.textContent = sol.interessado_nome;

    const tdTel = document.createElement('td');
    const linkZap = document.createElement('a');
    const numLimpo = sol.telefone.replace(/\D/g, '');
    linkZap.href = 'https://wa.me/55' + numLimpo;
    linkZap.target = '_blank';
    linkZap.rel = 'noopener';
    linkZap.textContent = sol.telefone;
    tdTel.appendChild(linkZap);

    const tdMoradia = document.createElement('td');
    tdMoradia.textContent = sol.moradia;

    const tdMsg = document.createElement('td');
    tdMsg.textContent = sol.mensagem || '-';

    const tdStatus = document.createElement('td');
    const select = document.createElement('select');
    ['pendente', 'contatado', 'aprovado', 'recusado'].forEach((st) => {
      const op = document.createElement('option');
      op.value = st;
      op.textContent = st;
      op.selected = sol.status === st;
      select.appendChild(op);
    });
    select.addEventListener('change', async () => {
      await db.from('solicitacoes_adocao').update({ status: select.value }).eq('id', sol.id);
    });
    tdStatus.appendChild(select);

    tr.append(tdData, tdAnimal, tdNome, tdTel, tdMoradia, tdMsg, tdStatus);
    listaSolicitacoes.appendChild(tr);
  });
}

async function carregarLogs() {
  const { data, error } = await db
    .from('logs_acesso')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(200);

  if (error) {
    console.error(error);
    return;
  }

  logsCache = data || [];
  totalLogs.textContent = String(logsCache.length);
  renderizarLogs();
}

function renderizarLogs() {
  const termo = filtroLog.value.trim().toLowerCase();
  const filtrados = logsCache.filter((item) => {
    if (!termo) return true;
    const linha = (item.usuario_nome + ' ' + item.acao + ' ' + (item.animal_nome || '')).toLowerCase();
    return linha.includes(termo);
  });

  tabelaLogsCorpo.innerHTML = '';

  filtrados.forEach((log) => {
    const tr = document.createElement('tr');
    const { data, hora } = formatarDataHoraBR(log.criado_em);

    const tdId = document.createElement('td');
    tdId.textContent = log.id;

    const tdUser = document.createElement('td');
    tdUser.textContent = log.usuario_nome;

    const tdBairro = document.createElement('td');
    tdBairro.textContent = log.bairro || '-';

    const tdAcao = document.createElement('td');
    tdAcao.textContent = log.acao;

    const tdAnimal = document.createElement('td');
    tdAnimal.textContent = log.animal_nome || '-';

    const tdData = document.createElement('td');
    tdData.textContent = data;

    const tdHora = document.createElement('td');
    tdHora.textContent = hora;

    tr.append(tdId, tdUser, tdBairro, tdAcao, tdAnimal, tdData, tdHora);
    tabelaLogsCorpo.appendChild(tr);
  });
}

filtroLog.addEventListener('input', renderizarLogs);
document.getElementById('btn-atualizar-logs').addEventListener('click', carregarLogs);

verificarSessao();