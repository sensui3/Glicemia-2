# Documento de Design do Projeto Controle de Glicemia

## Visão Geral

O projeto "Controle de Glicemia" é uma aplicação web moderna desenvolvida para auxiliar diabéticos e cuidadores no monitoramento eficaz da glicose sanguínea. A plataforma proporciona uma interface intuitiva e visual para registrar leituras, acompanhar tendências e gerenciar aspectos relacionados à saúde diabética.

### Público-Alvo
- Pacientes diabéticos
- Cuidadores
- Profissionais de saúde

### Objetivos Principais
- Facilitar o registro rápido de medições de glicose
- Fornecer visualizações claras de tendências e padrões
- Gerenciar medicações e consultas médicas
- Oferecer ferramentas para melhor controle da condição

## Arquitetura do Sistema

### Stack Tecnológica

#### Frontend
- **Framework**: Next.js 16.0.7 (App Router)
- **Linguagem**: TypeScript
- **Biblioteca de Interface**: React 19.2.1
- **Gerenciamento de Estado**: TanStack Query (React Query)
- **Estilização**: Tailwind CSS + Shadcn/ui
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **Formulários**: React Hook Form + Zod
- **Temas**: next-themes (modo claro/escuro)

#### Backend/Banco de Dados
- **Plataforma**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Armazenamento**: Supabase Database + Storage
- **Segurança**: Row Level Security (RLS)

#### Desenvolvimento
- **Testes**: Vitest + Playwright
- **Documentação**: Storybook
- **Linter/Formatter**: ESLint, Tailwind CSS
- **Versionamento**: Git
- **Gerenciamento de Dependências**: pnpm

### Arquitetura da Aplicação

#### Padrões de Projeto
- **Component-Based Architecture**: Componentes reutilizáveis e modulares
- **Separation of Concerns**: Separação clara entre dados, lógica e interface
- **Custom Hooks**: Lógica reutilizável do React extraída para hooks
- **Responsive Design**: Interface otimizada para desktop e mobile
- **Accessibility First**: Suporte a leitores de tela e navegação por teclado

#### Estrutura de Diretórios
```
app/                          # Páginas Next.js (App Router)
├── auth/                    # Páginas de autenticação
│   ├── login/              # Página de login
│   ├── cadastro/           # Página de cadastro
│   └── verificar-email/    # Verificação de email
└── dashboard/              # Área logada
    ├── layout.tsx          # Layout do dashboard
    ├── page.tsx           # Página principal
    ├── medicos/           # Gestão de médicos
    ├── medicacoes/        # Gestão de medicações
    └── novo/              # Novo registro

components/                  # Componentes reutilizáveis
├── ui/                     # Componentes base (Shadcn/ui)
├── dashboard-content.tsx   # Conteúdo principal do dashboard
├── glucose-chart.tsx      # Gráfico de glicose
├── glucose-table.tsx      # Tabela de leituras
└── ...                    # Outros componentes específicos

hooks/                      # Hooks customizados
├── use-glucose-data.ts    # Lógica de dados da glicose
├── use-user-profile.ts    # Perfil do usuário
└── ...                    # Outros hooks

lib/                        # Biblioteca utilitária
├── supabase/              # Configuração Supabase
│   ├── client.ts          # Cliente client-side
│   └── server.ts          # Cliente server-side
├── types.ts               # Tipos TypeScript
└── utils.ts               # Utils gerais

scripts/                   # Scripts de banco (SQL)
└── ...sql                 # Scripts de migração
```

## Modelo de Dados

O banco de dados utiliza PostgreSQL com Row Level Security (RLS) para isolamento de dados por usuário.

### Tabelas Principais

#### 1. auth.users (Supabase Built-in)
- `id`: UUID - Chave primária
- `email`: String - Email do usuário
- `created_at`: Timestamp - Data de criação

#### 2. public.profiles
Armazena perfis dos usuários, incluindo limites personalizáveis de glicose.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  glucose_limits JSONB DEFAULT '{"fasting_min": 70, "fasting_max": 99, "post_meal_max": 140, "hypo_limit": 70, "hyper_limit": 180}'::jsonb,
  glucose_unit TEXT DEFAULT 'mg/dL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

##### Estrutura GlucoseLimits:
```typescript
type GlucoseLimits = {
  fasting_min: number    // Mínimo em jejum (padrão: 70)
  fasting_max: number    // Máximo em jejum (padrão: 99)
  post_meal_max: number  // Máximo pós-refeição (padrão: 140)
  hypo_limit: number     // Limite de hipoglicemia (padrão: 70)
  hyper_limit: number    // Limite de hiperglicemia (padrão: 180)
}
```

#### 3. public.glucose_readings
Armazena todas as leituras de glicemia com contexto detalhado.

```sql
CREATE TABLE public.glucose_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_value INTEGER NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('jejum', 'antes_refeicao', 'apos_refeicao', 'ao_dormir', 'outro')),
  observations TEXT,
  carbs INTEGER,        -- Carboidratos consumidos
  calories INTEGER,     -- Calorias consumidas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. public.medications
Gestão completa de medicações, incluindo medicações contínuas e eventuais.

```sql
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  medication_type TEXT NOT NULL CHECK (medication_type IN ('insulina_rapida', 'insulina_lenta', 'insulina_intermediaria', 'insulina_basal', 'insulina_bolus', 'outro_medicamento')),
  dosage NUMERIC NOT NULL,
  dosage_unit TEXT NOT NULL CHECK (dosage_unit IN ('UI', 'mg', 'ml', 'comprimido')),
  administration_date DATE NOT NULL,
  administration_time TIME NOT NULL,
  notes TEXT,
  is_continuous BOOLEAN DEFAULT FALSE,
  continuous_dosage NUMERIC,
  continuous_dosage_unit TEXT CHECK (continuous_dosage_unit IN ('UI', 'mg', 'ml', 'comprimido')),
  is_active BOOLEAN DEFAULT TRUE,
  show_in_dashboard BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. public.doctors
Informações sobre profissionais de saúde do usuário.

```typescript
type Doctor = {
  id: string
  user_id: string
  name: string
  specialty: string
  address: string | null
  contact: string | null
  crm: string | null
  last_appointment: string | null
  next_appointment: string | null
  created_at: string
  updated_at: string
}
```

### Segurança
- **Row Level Security (RLS)**: Active em todas as tabelas
- **Políticas RLS**: Usuários só acessam seus próprios dados
- **Autenticação**: Supabase Auth com JWT
- **Validação**: Zod schemas para validação de dados
- **Sanitização**: Input sanitizado no frontend
- **Atualizações de Segurança**: Vulnerabilidades críticas corrigidas (e.g., CVE-2025-66478 - Execução Remota de Código corrigida)

### Índices de Performance
```sql
-- Glicemia
CREATE INDEX idx_glucose_readings_user_id ON glucose_readings(user_id);
CREATE INDEX idx_glucose_readings_date ON glucose_readings(reading_date DESC);
CREATE INDEX idx_glucose_readings_user_date ON glucose_readings(user_id, reading_date DESC);

-- Medicações
CREATE INDEX idx_medications_user_id ON medications(user_id);
CREATE INDEX idx_medications_date ON medications(administration_date DESC);
CREATE INDEX idx_medications_user_date ON medications(user_id, administration_date DESC);
```

## Componentes Principais

### Interface de Usuário

#### Layout e Navegação
- **DashboardHeader**: Header com user info e ações rápidas
- **SidebarNav**: Navegação lateral responsiva
- **MobileMenu**: Menu mobile otimizado
- **ModeToggle**: Alternador tema claro/escuro

#### Dashboard Principal
- **DashboardContent**: Container principal com widgets
- **GlucoseChart**: Gráfico interativo de tendências
- **GlucoseStats**: Estatísticas resumidas
- **GlucoseTable**: Tabela filtrável de leituras
- **MedicalCalendar**: Calendário médico com eventos

#### Modais e Formulários
- **NovoRegistroModal**: Formulário para nova leitura
- **EditarRegistroModal**: Edição de leitura existente
- **ConfiguracoesModal**: Configurações do usuário
- **ExportarDadosModal**: Exportação de dados

#### Gestão de Medicações
- **MedicacoesWidget**: Widget principal no dashboard
- **MedicacoesContent**: Página dedicada
- **NovaMedicacaoModal**: Cadastro/edição
- **MedicacaoItem**: Componente para cada medicação

#### Gestão de Médicos
- **DoctorsList**: Lista de médicos com filtros
- **DoctorModal**: CRUD de médicos
- **DoctorCard**: Card informativo de médico

### Componentes de Biblioteca (UI)
Utiliza Shadcn/ui com Tailwind CSS:
- Button, Card, Input, Select, Dialog, Table
- Charts (Recharts), Calendars (React Day Picker)
- Toast notifications, Loading states, Forms

## Fluxos de Autenticação

### Cadastro
1. Usuário acessa `/auth/cadastro`
2. Preenche formulário (email, senha, confirmação)
3. Validação frontend (Zod)
4. Criação conta via Supabase Auth
5. Email de verificação enviado
6. Redirecionamento para `/auth/verificar-email`

### Login
1. Usuário acessa `/auth/login`
2. Preenche credenciais
3. Autenticação via Supabase Auth
4. Redirecionamento para `/dashboard`

### Verificação de Email
1. Link no email redireciona para `/auth/verificar-email`
2. Verificação do token via Supabase
3. Redirecionamento para `/dashboard`

### Proteção de Rotas
- Layout protegido verifica autenticação
- Redirect para login se não autenticado
- Roteamento server-side no Next.js

## Gerenciamento de Estado

### TanStack Query
- **Cache inteligente**: Dados em cache com revalidação automática
- **Sincronização**: Estado consistente entre sessões
- **Optimistic updates**: Atualizações imediatas com rollback em erro
- **Background refetch**: Dados sempre atualizados

### Hooks Customizados
- **useGlucoseData**: Busca e gerenciamento de leituras
- **useUserProfile**: Perfil e limites do usuário
- **useToast**: Sistema de notificações
- **useMobile**: Detecção de dispositivo

## Funcionalidades Core

### 1. Registro de Leituras
- **Interface rápida**: Formulário modal otimizado
- **Contexto inteligente**: Jejum, antes/após refeição, ao dormir
- **Observações**: Campo livre para notas
- **Validação automática**: Limites configuráveis por usuário
- **Feedback visual**: Alerta hypoglycemia/hiperglycemia

### 2. Visualizações Gráficas
- **Tendência temporal**: Evolução da glicemia ao longo do tempo
- **Filtragem dinâmica**: Períodos customizáveis
- **Interatividade**: Tooltips, zoom, seleção
- **Métricas agregadas**: Médias, mínimos, máximos
- **Comparação períodos**: Análise comparativa

### 3. Gestão de Medicações
- **Tipos especializados**: Diferentes tipos de insulina
- **Medicações contínuas**: Dosagem padrão e ativação manual
- **Dashboard visibility**: Controle de exibição no painel
- **Histórico completo**: Todas as administrações

### 4. Calendário Médico
- **Eventos customizáveis**: Consultas, exames, vacinas
- **Categorização**: Por médico, tipo de procedimento
- **Lembretes**: Próxima consulta destacada
- **Integração calendário**: Export para calendário externo

### 5. Perfil e Configurações
- **Limites personalizáveis**: Glicemia por contexto
- **Unidade de medida**: mg/dL ou mmol/L
- **Nome completo**: Identificação pessoal
- **Tema**: Claro/escuro automaticamente

### 6. Exportação de Dados
- **Formato universal**: CSV exportável
- **Período customizável**: Datas específicas
- **Compatibilidade**: Arquivos legíveis por planilhas
- **Privacidade**: Dados locais no navegador

## Sistema de Design Visual (Semântica Stitch)

Para garantir a consistência visual em novas telas e componentes gerados via Stitch, o sistema segue esta linguagem:

### 1. Tema Visual e Atmosfera
O design segue uma estética **"Clínica Moderna"** — equilibrando a precisão médica com um toque amigável e focado no bem-estar do usuário. A interface é **Arejada** mas **Rica em Dados**, priorizando a clareza e a calma. O clima é de **Confiabilidade**, **Limpeza** e **Otimismo**, desenhado para reduzir o estresse do monitoramento contínuo de saúde.

### 2. Paleta de Cores e Papéis Semânticos
*   **Vibrant Trust Blue (#135bec):** Cor Primária, transmitindo confiança e autoridade. Usada para botões principais, destaques de navegação e estados ativos.
*   **Clinical Snow White (#ffffff):** Cor de Fundo no modo claro, proporcionando um ambiente estéril e livre de distrações.
*   **Deep Slate Grey (#1a2b3c):** Cor principal para Texto e Foreground, garantindo alto contraste e legibilidade profissional.
*   **Warning Crimson (#ea2a33):** Cor semântica para alertas de Hiperglicemia, ações destrutivas e erros críticos.
*   **Health Emerald (#13ec5b):** Cor semântica para indicadores de "Tempo no Alvo", recuperação e estados de sucesso.
*   **Muted Silver (oklch(0.922 0 0)):** Usada para bordas, separadores e inputs inativos, fornecendo uma estrutura sutil.

### 3. Regras de Tipografia
*   **Família de Fontes:** **Inter** (Sans-serif). Uma tipografia moderna e altamente legível, escolhida pela clareza geométrica e excelente performance em interfaces densas em dados.
*   **Cabeçalhos:** Pesos *Semibold* ou *Bold* são usados para títulos de página e leituras de glicose em destaque para criar uma hierarquia visual clara.
*   **Corpo:** Peso *Regular* com entrelinha generosa para facilitar a leitura de notas médicas e descrições.
*   **Dados:** Números em tabelas e gráficos usam peso *Medium* para se destacarem de rótulos de suporte.

### 4. Estilização de Componentes
*   **Botões:** Apresentam **cantos sutilmente arredondados** (`rounded-lg`, `radius: 0.625rem`). Usam fundos sólidos para ações primárias e estilos *ghost/outline* para navegação secundária.
*   **Cards/Containers:** Definidos por **cantos sutilmente arredondados** (`rounded-lg`) e **sombras suaves e difusas**. Os fundos são tipicamente brancos sólidos ou cinzas muito levemente coloridos para separar os widgets no painel.
*   **Inputs/Formulários:** Usam um estilo de **traço nítido e limpo** com borda Cinza Claro. Os estados focados são destacados com um anel azul suave na cor Primária.

### 5. Princípios de Layout
*   **Densidade Arejada:** O espaço em branco é usado estrategicamente para evitar que o usuário seja sobrecarregado pelo alto volume de dados médicos e gráficos.
*   **Disciplina de Grade:** Um sistema de grade rígido garante que os widgets do painel (Gráficos, Tabelas, Estatísticas) estejam perfeitamente alinhados, criando um senso de ordem.
*   **Fluidez Responsiva:** O layout transita de um "centro de comando" multi-coluna no desktop para uma visualização móvel focada em uma única coluna que prioriza formulários de entrada rápida e estatísticas de resumo.

## Performance e Otimização

### Estratégias de Performance
- **Server Components**: Renderização server-side
- **Client Components**: Apenas quando necessário
- **Código splitting**: Carregamento sob demanda
- **Image optimization**: Next.js Image component
- **Bundle analysis**: Otimização de pacotes

### Cache e Estado
- **ISR**: Pages cacheadas no build
- **Query cache**: Dados em cache no navegador
- **Offline first**: Funcionalidade básica offline
- **Sync estratégias**: Reconciliação automática

## Desenvolvimento e Deployment

### Ambiente de Desenvolvimento
- **Hot reload**: Desenvolvimento em tempo real
- **Type checking**: TypeScript errors visíveis
- **Linting**: ESLint regras consistente
- **Storybook**: Desenvolvimento isolado de componentes

### Deployment
- **Vercel**: Plataforma de deployment otimizada
- **Environment variables**: Config segura por ambiente
- **Analytics**: Vercel Analytics integrada
- **CDN**: Entrega global otimizada

### Testes
- **Unit tests**: Vitest para funções utilitárias
- **Integration tests**: Playwright para fluxos completos
- **Component tests**: Storybook para interface
- **E2E tests**: Cobertura de cenários críticos

## Extensibilidade e Manutenibilidade

### Padrões de Código
- **ESLint + Prettier**: Formatação consistente
- **TypeScript strict**: Type safety máxima
- **Conventional commits**: Git commits padronizados
- **Documentação**: README e comentários claros

### Arquitetura Escalável
- **Component composition**: Composição vs herança
- **Custom hooks**: Lógica reutilizável
- **Utility functions**: Funções puras e testáveis
- **Configuration based**: Configurações externalizadas

### Futuras Melhorias
- **PWA**: Funcionalidade offline avançada
- **Push notifications**: Lembretes inteligentes
- **AI insights**: Análise preditiva com IA
- **Social features**: Compartilhamento com cuidadores
- **Integration APIs**: Conectores externos (Apple Health, etc.)

---

*Este documento é uma referência completa para entender, manter e estender o projeto Controle de Glicemia.*
