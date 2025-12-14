# Controle de Glicemia
## 🩸 Monitoramento Simples e Eficaz

Sistema moderno para acompanhamento de glicose, desenvolvido para ajudar diabéticos e cuidadores a manterem o controle da saúde de forma intuitiva e visual.

![Dashboard Preview](./public/preview-placeholder.png)

## 🚀 Funcionalidades Principais

*   **Dashboard Intuitivo**: Visão geral com gráficos e estatísticas vitais.
*   **Registro Rápido**: Adicione medições de glicemia em segundos com contexto (jejum, pós-refeição, etc.).
*   **Calendário Médico**: Gerencie consultas, exames e vacinas. Sincronizado na nuvem (Supabase Storage).
*   **Histórico Detalhado**: Tabela pesquisável e filtrável de todas as suas leituras.
*   **Insights Visuais**: Gráficos de tendência para identificar padrões.
*   **Gestão de Medicamentos**: Acompanhe o uso de insulina e outros medicamentos com suporte a medicações contínuas.
*   **Gestão de Médicos**: Cadastre e organize informações dos seus profissionais de saúde.
*   **Autenticação Seguro**: Sistema completo de login, cadastro e verificação de email.
*   **Tema Personalizável**: Suporte a temas claro e escuro.
*   **Exportação de Dados**: Exporte seus registros para análise externa.
*   **Design Responsivo**: Interface otimizada para desktop e dispositivos móveis.
*   **Alertas Inteligentes**: Feedback imediato para níveis altos (cetoacidose) ou baixos (hipoglicemia).
*   **Acessibilidade**: Interface otimizada para leitores de tela e navegação por teclado.

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza uma stack moderna e performática:

*   **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), React, TypeScript per linter e typing.
*   **Estilização**: Tailwind CSS + Shadcn/ui (Radix UI) para componentes acessíveis e bonitos.
*   **Ícones**: Lucide React.
*   **Gráficos**: Recharts.
*   **Backend / Auth**: [Supabase](https://supabase.com/).
*   **Persistência**: Supabase Database (PostgreSQL) e Storage (para arquivos JSON).
*   **Testes e Documentação**: Storybook para desenvolvimento de componentes.

## ⚙️ Instalação e Configuração

### Pré-requisitos

*   Node.js 18+
*   Conta no Supabase

### Passo a Passo

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/seu-usuario/controle-glicemia.git
    cd controle-glicemia
    ```

2.  **Instale as dependências**
    ```bash
    npm install
    # ou
    pnpm install
    ```

3.  **Configure o Supabase**
    *   Crie um projeto no Supabase.
    *   Vá em **SQL Editor** e execute os scripts da pasta `scripts/`:
        1.  `scripts/001_create_tables.sql` (Cria tabelas do banco)
        2.  `scripts/002_setup_storage.sql` (Configura bucket de armazenamento)

4.  **Configure as Variáveis de Ambiente**
    *   Renomeie `.env.example` para `.env.local` (ou crie um novo).
    *   Adicione suas chaves do Supabase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
    ```

5.  **Rode o projeto**
    ```bash
    npm run dev
    ```
    Acesse `http://localhost:3000` 🚀

## 📦 Storybook

Para visualizar e testar os componentes de interface isoladamente:

```bash
npm run storybook
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir Issues ou Pull Requests.

1.  Fork o projeto
2.  Crie sua Feature Branch (`git checkout -b feature/NovaFeature`)
3.  Commit suas mudanças (`git commit -m 'Add some NovaFeature'`)
4.  Push para a Branch (`git push origin feature/NovaFeature`)
5.  Abra um Pull Request

## 📄 Licença

Este projeto é open-source. Sinta-se livre para usar e modificar.
