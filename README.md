# Controle de Glicemia
## 🩸 Monitoramento Simples e Eficaz

Sistema moderno para acompanhamento de glicose, desenvolvido para ajudar diabéticos e cuidadores a manterem o controle da saúde de forma intuitiva e visual.

![Dashboard Preview](./public/preview-placeholder.png)

## 📖 Documentação

Para informações técnicas detalhadas sobre arquitetura, banco de dados, componentes e design do sistema, consulte o **[DESIGN.md](./DESIGN.md)**.

## 🚀 Funcionalidades Principais

*   **Dashboard Intuitivo**: Visão geral com gráficos e estatísticas vitais
*   **Registro Rápido**: Adicione medições de glicemia em segundos com contexto (jejum, pós-refeição, ao dormir, etc.)
*   **Monitoramento Nutricional**: Registre carboidratos e calorias consumidas nas refeições
*   **Calendário Médico**: Gerencie consultas, exames e vacinas com lembretes inteligentes
*   **Histórico Detalhado**: Tabela pesquisável, filtrável e paginada de todas as leituras
*   **Insights Visuais**: Gráficos interativos de tendência com período customizável
*   **Gestão de Medicamentos**: Acompanhe diferentes tipos de insulina e medicamentos com suporte a medicações contínuas
*   **Gestão de Médicos**: Cadastre e organize informações completas dos profissionais de saúde
*   **Perfil Personalizável**: Limites de glicemia configuráveis por usuário (mg/dL ou mmol/L)
*   **Autenticação Seguro**: Sistema completo de login, cadastro e verificação de email
*   **Tema Personalizável**: Suporte automático a temas claro e escuro
*   **Exportação de Dados**: Exporte registros em formato CSV para análise externa
*   **Design Responsivo**: Interface otimizada para desktop, tablet e dispositivos móveis
*   **Alertas Inteligentes**: Feedback visual imediato para níveis de hipoglicemia e hiperglicemia
*   **Acessibilidade**: Interface totalmente acessível com suporte a leitores de tela e navegação por teclado

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

#### Frontend
*   **Framework**: [Next.js 16.0.7](https://nextjs.org/) (App Router)
*   **UI Library**: React 19.2.1 + TypeScript 5.x
*   **Gerenciamento de Estado**: TanStack Query 5.90.12 para cache inteligente
*   **Formulários**: React Hook Form + Zod para validação robusta
*   **Estilização**: Tailwind CSS 4.1.9 + Shadcn/ui (Radix UI primitives)
*   **Temas**: next-themes para alternância automática
*   **Gráficos**: Recharts para visualizações interativas
*   **Ícones**: Lucide React 0.454.0

#### Backend & Database
*   **Backend-as-a-Service**: [Supabase](https://supabase.com/)
*   **Database**: PostgreSQL com Row Level Security (RLS)
*   **Authentication**: Supabase Auth (JWT)
*   **File Storage**: Supabase Storage para backups e arquivos

#### Desenvolvimento & Qualidade
*   **Testes**: Vitest + Playwright para testes unitários e E2E
*   **Storybook**: Desenvolvimento isolado de componentes
*   **Linting**: ESLint para qualidade de código
*   **Build Tool**: pnpm + Next.js build
*   **Deployment**: Vercel (otimizado para Next.js)

## 🔒 Segurança

### Vulnerabilidades Corrigidas

Este projeto foi atualizado para corrigir uma vulnerabilidade crítica de execução remota de código (RCE) no React Server Components. A atualização foi aplicada em **15/12/2025**:

- **CVE-2025-66478**: Vulnerabilidade crítica (CVSS 10.0) afetando React Server Components em Next.js e React
- **Versões afetadas** (corrigidas em 15/12/2025):
  - Next.js: 15.x ou 16.x com App Router
  - React: 19.0.0, 19.1.0, 19.1.1, 19.2.0
- **Versões corrigidas aplicadas**:
  - Next.js: **16.0.7**
  - React & React-DOM: **19.2.1**

Para mais detalhes, consulte:
- [Next.js Security Update](https://nextjs.org/blog/security-update-2025-12-11)
- [Vercel Changelog CVE-2025-55182](https://vercel.com/changelog/cve-2025-55182)

**Nota**: Se você estiver fazendo deploy no Vercel, versões vulneráveis são bloqueadas automaticamente durante o build.

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

2.  **Configure o Supabase**
    *   Crie um projeto no Supabase
    *   Vá em **SQL Editor** e execute os scripts da pasta `scripts/` na seguinte ordem:
        1. `scripts/001_create_tables.sql` (Cria tabelas principais)
        2. `scripts/002_create_medications_table.sql` (Tabela de medicações)
        3. `scripts/002_setup_storage.sql` (Configura bucket de armazenamento)
        4. `scripts/003_create_profiles.sql` (Perfis de usuário)
        5. `scripts/003_add_continuous_medications.sql` (Suporte medicações contínuas)
        6. `scripts/003_add_nutrition_fields.sql` (Campos nutricionais)
        7. `scripts/004_add_medication_dashboard_visibility.sql` (Visibilidade no dashboard)

3.  **Instale as dependências**
    ```bash
    npm install
    # ou
    pnpm install
    ```

4.  **Configure as Variáveis de Ambiente**
    *   Crie um arquivo `.env.local` na raiz do projeto
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
