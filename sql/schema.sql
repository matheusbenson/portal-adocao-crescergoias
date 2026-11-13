create table if not exists animais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  especie text not null check (especie in ('Cão', 'Gato', 'Outro')),
  porte text not null check (porte in ('Pequeno', 'Médio', 'Grande')),
  idade text not null,
  sexo text not null check (sexo in ('Macho', 'Fêmea')),
  bairro text not null,
  castrado boolean not null default false,
  vacinado boolean not null default false,
  descricao text not null,
  foto_url text not null,
  status text not null default 'disponivel' check (status in ('disponivel', 'em_analise', 'adotado')),
  criado_em timestamptz not null default now()
);

create table if not exists solicitacoes_adocao (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animais(id) on delete cascade,
  animal_nome text not null,
  interessado_nome text not null,
  telefone text not null,
  moradia text not null,
  mensagem text,
  status text not null default 'pendente' check (status in ('pendente', 'contatado', 'aprovado', 'recusado')),
  criado_em timestamptz not null default now()
);

create table if not exists logs_acesso (
  id bigint generated always as identity primary key,
  usuario_nome text not null,
  bairro text,
  acao text not null,
  animal_nome text,
  criado_em timestamptz not null default now()
);

alter table animais enable row level security;
alter table solicitacoes_adocao enable row level security;
alter table logs_acesso enable row level security;

create policy "Leitura publica de animais"
  on animais for select
  using (true);

create policy "Gestao de animais apenas autenticado"
  on animais for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Envio publico de solicitacao"
  on solicitacoes_adocao for insert
  with check (true);

create policy "Gestao de solicitacoes apenas autenticado"
  on solicitacoes_adocao for select
  using (auth.role() = 'authenticated');

create policy "Atualizacao de solicitacoes apenas autenticado"
  on solicitacoes_adocao for update
  using (auth.role() = 'authenticated');

create policy "Registro publico de log de acesso"
  on logs_acesso for insert
  with check (true);

create policy "Leitura de logs apenas autenticado"
  on logs_acesso for select
  using (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('animais', 'animais', true)
on conflict (id) do nothing;

create policy "Leitura publica fotos animais"
  on storage.objects for select
  using (bucket_id = 'animais');

create policy "Upload autenticado fotos animais"
  on storage.objects for insert
  with check (bucket_id = 'animais' and auth.role() = 'authenticated');