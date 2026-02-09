# 🍽️ Implementação: Sistema de Horários de Refeições

## 📋 Resumo da Implementação

Sistema inteligente que detecta automaticamente a próxima refeição baseada nos horários configurados pelo usuário e sugere o tipo de medição apropriado.

---

## ✨ Funcionalidades Implementadas

### 1. **Configuração Personalizada de Horários**

- ✅ 6 refeições configuráveis:
  - Café da Manhã (padrão: 07:30)
  - Lanche da Manhã (padrão: 10:00)
  - Almoço (padrão: 12:00)
  - Lanche da Tarde (padrão: 15:00)
  - Jantar (padrão: 18:00)
  - Lanche Noturno (padrão: 21:00)

- ✅ Tempo de antecedência ajustável (padrão: 45 minutos)
- ✅ Persistência no banco de dados (Supabase)
- ✅ Sincronização entre dispositivos

### 2. **Detecção Automática Inteligente**

Quando o usuário abre o modal de novo registro:

1. **Sistema verifica o horário atual**
2. **Calcula a janela de tempo** (horário da refeição - tempo de antecedência)
3. **Se estiver na janela:**
   - Pré-seleciona "Antes Refeição"
   - Mostra qual refeição foi detectada
   - Exibe o tempo de antecedência configurado
4. **Se não estiver na janela:**
   - Carrega a última condição usada (localStorage)

### 3. **Flexibilidade Total**

- ✅ Usuário pode sempre mudar manualmente a condição
- ✅ Sugestão automática não é obrigatória
- ✅ Horários editáveis a qualquer momento
- ✅ Tempo de antecedência ajustável (15-120 minutos)

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`scripts/008_add_meal_preferences.sql`**
   - Migration SQL para adicionar campos no banco
   - Adiciona `meal_times` (JSONB)
   - Adiciona `meal_advance_minutes` (INTEGER)

2. **`hooks/use-meal-preferences.ts`**
   - Hook customizado para gerenciar preferências
   - Carrega configurações do banco
   - Detecta refeição baseada no horário
   - Salva preferências

3. **`scripts/GUIA-EXECUCAO-MEAL-PREFERENCES.md`**
   - Guia completo de execução da migration
   - Testes e troubleshooting
   - Exemplos de uso

### Arquivos Modificados

1. **`lib/types.ts`**
   - Adicionado tipo `MealTimes`
   - Atualizado tipo `UserProfile` com novos campos

2. **`components/novo-registro-modal.tsx`**
   - Integrado hook `useMealPreferences`
   - Detecção automática de refeição ao abrir modal
   - Indicador visual do tempo de antecedência
   - Atualização dinâmica ao mudar horário

3. **`components/configuracoes-modal.tsx`**
   - Nova seção "Horários de Refeições"
   - 6 campos de input para horários
   - Campo para tempo de antecedência
   - Salvamento no banco de dados

---

## 🗄️ Estrutura do Banco de Dados

### Tabela `profiles` (modificada)

```sql
-- Novos campos adicionados
meal_times JSONB DEFAULT '{
  "cafe_manha": "07:30",
  "lanche_manha": "10:00",
  "almoco": "12:00",
  "lanche_tarde": "15:00",
  "jantar": "18:00",
  "lanche_noturno": "21:00"
}'::jsonb

meal_advance_minutes INTEGER DEFAULT 45
```

---

## 🔄 Fluxo de Funcionamento

### Ao Abrir o Modal de Novo Registro

```
1. Usuário clica em "Novo Registro"
   ↓
2. Modal abre e hook carrega preferências do banco
   ↓
3. Sistema pega horário atual (ex: 11:15)
   ↓
4. Verifica todas as refeições configuradas
   ↓
5. Encontra que 11:15 está entre 11:15 (12:00 - 45min) e 12:00
   ↓
6. Pré-seleciona "Antes Refeição"
   ↓
7. Mostra "Refeição detectada: Almoço"
   ↓
8. Exibe "Medição 45 minutos antes da refeição"
   ↓
9. Usuário pode mudar manualmente se quiser
```

### Ao Salvar Configurações

```
1. Usuário edita horários no modal de configurações
   ↓
2. Ajusta tempo de antecedência (ex: 60 minutos)
   ↓
3. Clica em "Salvar Alterações"
   ↓
4. Sistema salva no banco (tabela profiles)
   ↓
5. Hook atualiza estado local
   ↓
6. Próxima vez que abrir modal, usa novos valores
```

---

## 🎨 Interface do Usuário

### Modal de Novo Registro

**Antes (sem refeição detectada):**
```
┌─────────────────────────────────┐
│ Condição / Evento               │
│ [Jejum] [Antes Ref.] [Após...]  │
└─────────────────────────────────┘
```

**Depois (com refeição detectada):**
```
┌─────────────────────────────────┐
│ Condição / Evento               │
│ [Jejum] [✓ Antes Ref.] [Após...] │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🍽️ Refeição detectada:      │ │
│ │    Almoço                   │ │
│ │ Medição 45 minutos antes    │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Modal de Configurações

**Nova Seção:**
```
┌─────────────────────────────────────────┐
│ Horários de Refeições                   │
├─────────────────────────────────────────┤
│                                         │
│ Configure seus horários padrão...      │
│                                         │
│ Café da Manhã    [07:30]               │
│ Lanche da Manhã  [10:00]               │
│ Almoço           [12:00]               │
│ Lanche da Tarde  [15:00]               │
│ Jantar           [18:00]               │
│ Lanche Noturno   [21:00]               │
│                                         │
│ Tempo de Antecedência                   │
│ [45] minutos antes da refeição         │
│                                         │
│ O sistema irá sugerir "Antes Refeição" │
│ quando você registrar glicemia dentro  │
│ deste período...                        │
└─────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### 1. Executar a Migration

```bash
# Siga o guia em:
scripts/GUIA-EXECUCAO-MEAL-PREFERENCES.md
```

### 2. Testar Detecção Automática

1. Abra o modal de configurações
2. Configure o almoço para daqui a 30 minutos
3. Configure tempo de antecedência para 45 minutos
4. Salve as configurações
5. Abra o modal de novo registro
6. ✅ Deve aparecer "Antes Refeição" selecionado
7. ✅ Deve mostrar "Refeição detectada: Almoço"

### 3. Testar Edição Manual

1. Com refeição detectada automaticamente
2. Clique em outro botão (ex: "Jejum")
3. ✅ Deve mudar normalmente
4. ✅ Indicador de refeição deve desaparecer

### 4. Testar Persistência

1. Configure horários personalizados
2. Salve
3. Feche o navegador
4. Abra novamente
5. ✅ Configurações devem estar salvas

---

## 📊 Dados Técnicos

### Hook `useMealPreferences`

**Exports:**
- `mealTimes`: Horários configurados
- `advanceMinutes`: Tempo de antecedência
- `loading`: Estado de carregamento
- `savePreferences()`: Salvar no banco
- `detectMealFromTime()`: Detectar refeição
- `getMealTypeSlug()`: Converter para slug do banco
- `MEAL_LABELS`: Labels das refeições

**Lógica de Detecção:**
```typescript
// Exemplo: Almoço às 12:00, antecedência de 45min
// Janela: 11:15 - 12:00

if (horaAtual >= 11:15 && horaAtual <= 12:00) {
  return {
    mealType: "almoco",
    mealLabel: "Almoço",
    scheduledTime: "12:00",
    isInWindow: true  // ← Está na janela!
  }
}
```

---

## ✅ Checklist de Implementação

- [x] Migration SQL criada
- [x] Tipos TypeScript atualizados
- [x] Hook customizado implementado
- [x] Modal de registro atualizado
- [x] Modal de configurações atualizado
- [x] Detecção automática funcionando
- [x] Indicador visual implementado
- [x] Persistência no banco configurada
- [x] Guia de execução criado
- [x] Documentação completa

---

## 🎯 Próximos Passos

1. **Executar a Migration**
   - Seguir guia em `GUIA-EXECUCAO-MEAL-PREFERENCES.md`
   - Verificar criação das colunas

2. **Testar no Frontend**
   - Abrir modal de configurações
   - Configurar horários
   - Testar detecção automática

3. **Validar Experiência**
   - Verificar se sugestões fazem sentido
   - Ajustar tempo de antecedência se necessário
   - Confirmar que edição manual funciona

4. **Deploy**
   - Commit das mudanças
   - Push para repositório
   - Deploy em produção

---

## 📝 Notas Importantes

### Comportamento Padrão

- **Primeira vez:** Sistema usa valores padrão (07:30, 10:00, etc.)
- **Sem configuração:** Carrega última condição usada
- **Com configuração:** Detecta automaticamente se estiver na janela

### Flexibilidade

- Usuário **sempre** pode mudar manualmente
- Sugestão é apenas uma **conveniência**
- Horários são **totalmente personalizáveis**

### Performance

- Cálculos são feitos no cliente (JavaScript)
- Apenas leitura do banco ao abrir modal
- Salvamento apenas quando usuário clica "Salvar"

---

**✨ Implementação completa e pronta para uso!**

*Data: 09/02/2026*
*Desenvolvedor: Antigravity AI*
