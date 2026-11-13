# Portal de Adoção de Animais – Crescer Goiás

Sistema web desenvolvido para a disciplina Atividade Extensionista II do curso de Análise e Desenvolvimento de Sistemas (UNINTER), voltado ao apoio de ações de adoção responsável de animais junto à comunidade local e à ONG Crescer Goiás (Aparecida de Goiânia - GO).

## Funcionalidades

- Vitrine pública de animais com filtros por espécie, porte, nome/bairro e status.
- Recursos de acessibilidade baseados nos princípios do Desenho Universal (aumento/redução de fonte, alto contraste, navegação por teclado e validação clara de formulários).
- Registro de interesse em adoção com encaminhamento ao painel administrativo.
- Painel restrito (autenticação via Supabase Auth) para cadastro de animais, upload de imagens, gestão de solicitações e consulta ao fluxo de acessos (nome do usuário, ação, data e horário).

## Tecnologias

- HTML5, CSS3 e JavaScript (Vanilla)
- Supabase (PostgreSQL, Auth e Storage)

## Configuração

1. Crie um projeto gratuito no [Supabase](https://supabase.com/).
2. No **SQL Editor**, execute o script `sql/schema.sql`.
3. Em **Authentication → Users**, crie o usuário administrador (e-mail e senha) que acessará o `admin.html`.
4. Em `js/supabase-config.js`, substitua `SUPABASE_URL` e `SUPABASE_ANON_KEY` pelas chaves públicas do seu projeto (Project Settings → API).
5. Em `index.html`, atualize os dois links `https://docs.google.com/forms/` com o link do seu formulário de feedback do Google Forms.
6. Publique os arquivos no GitHub Pages, Netlify ou Vercel.