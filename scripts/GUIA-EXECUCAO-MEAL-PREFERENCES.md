# 🍽️ Guia de Execução - Script de Horários de Refeições

## ✅ Configuração de Horários Padrão de Refeições

Este guia explica como executar o script `008_add_meal_preferences.sql` no Supabase.

---

## 📋 O que Este Script Faz

Este script adiciona dois novos campos na tabela `profiles`:

1. **`meal_times`** (JSONB): Armazena os horários padrão das 6 refeições do dia
2. **`meal_advance_minutes`** (INTEGER): Define quantos minutos antes da refeição o sistema deve sugerir "Antes Refeição"

### Valores Padrão

```json
{
  "cafe_manha": "07:30",
  "lanche_manha": "10:00",
  "almoco": "12:00",
  "lanche_tarde": "15:00",
  "jantar": "18:00",
  "lanche_noturno": "21:00"
}
```

**Tempo de antecedência padrão:** 45 minutos

---

## 📋 Passo a Passo para Executar

### 1️⃣ Acessar o Supabase SQL Editor

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2️⃣ Copiar o Script

1. Abra o arquivo `scripts/008_add_meal_preferences.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)

### 3️⃣ Executar o Script

1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução (deve ser instantâneo)
3. Verifique se não há erros

---

## ✅ Verificação Pós-Execução

### Verificar Colunas Criadas

Execute no SQL Editor:

```sql
-- Verificar estrutura da tabela profiles
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('meal_times', 'meal_advance_minutes')
ORDER BY column_name;
```

**Resultado esperado:** 2 colunas listadas

### Verificar Valores Padrão

Execute no SQL Editor:

```sql
-- Ver os valores padrão aplicados
SELECT 
  user_id,
  meal_times,
  meal_advance_minutes
FROM profiles
LIMIT 5;
```

**Resultado esperado:** 
- `meal_times` com os horários padrão (ou NULL se perfil ainda não foi atualizado)
- `meal_advance_minutes` = 45 (ou NULL)

---

## 🔄 Executar Novamente (Se Necessário)

**É SEGURO executar o script múltiplas vezes!**

O script usa `ADD COLUMN IF NOT EXISTS`, então:
- ✅ Se as colunas já existem, nada acontece
- ✅ Se não existem, são criadas com valores padrão
- ✅ Dados existentes não são afetados

---

## 🧪 Testar Funcionalidades

### Teste 1: Atualizar Horários de um Usuário

```sql
-- Atualizar horários de refeição (substitua pelo seu user_id)
UPDATE profiles
SET 
  meal_times = '{
    "cafe_manha": "06:30",
    "lanche_manha": "09:30",
    "almoco": "12:30",
    "lanche_tarde": "15:30",
    "jantar": "19:00",
    "lanche_noturno": "22:00"
  }'::jsonb,
  meal_advance_minutes = 60
WHERE user_id = 'seu-user-id-aqui';
```

### Teste 2: Verificar Horário de uma Refeição Específica

```sql
-- Buscar horário do almoço de um usuário
SELECT 
  user_id,
  meal_times->>'almoco' as horario_almoco,
  meal_advance_minutes
FROM profiles
WHERE user_id = 'seu-user-id-aqui';
```

### Teste 3: Resetar para Valores Padrão

```sql
-- Resetar para valores padrão
UPDATE profiles
SET 
  meal_times = '{
    "cafe_manha": "07:30",
    "lanche_manha": "10:00",
    "almoco": "12:00",
    "lanche_tarde": "15:00",
    "jantar": "18:00",
    "lanche_noturno": "21:00"
  }'::jsonb,
  meal_advance_minutes = 45
WHERE user_id = 'seu-user-id-aqui';
```

---

## ⚠️ Troubleshooting

### Erro: "column already exists"

**Causa:** Coluna já existe (normal se executar múltiplas vezes)

**Solução:** Ignore, o script usa `IF NOT EXISTS`

### Erro: "table profiles does not exist"

**Causa:** Tabela profiles ainda não foi criada

**Solução:** Execute o script `003_create_profiles.sql` primeiro

### Erro: "permission denied"

**Causa:** Usuário sem permissões adequadas

**Solução:** 
1. Certifique-se de estar logado como owner do projeto
2. Verifique permissões no Supabase Dashboard

---

## 📊 Estrutura Criada

### Novas Colunas na Tabela `profiles`

| Coluna | Tipo | Padrão | Descrição |
|--------|------|--------|-----------|
| `meal_times` | JSONB | Horários padrão | Horários das 6 refeições diárias |
| `meal_advance_minutes` | INTEGER | 45 | Minutos antes da refeição para sugestão |

### Estrutura do JSONB `meal_times`

```json
{
  "cafe_manha": "HH:MM",      // Café da Manhã
  "lanche_manha": "HH:MM",    // Lanche da Manhã
  "almoco": "HH:MM",          // Almoço
  "lanche_tarde": "HH:MM",    // Lanche da Tarde
  "jantar": "HH:MM",          // Jantar
  "lanche_noturno": "HH:MM"   // Lanche Noturno
}
```

---

## 🎯 Como Funciona no Sistema

### 1. Detecção Automática

Quando o usuário abre o modal de novo registro:

1. Sistema verifica o horário atual
2. Compara com os horários configurados em `meal_times`
3. Se estiver dentro de `meal_advance_minutes` antes de uma refeição:
   - ✅ Pré-seleciona "Antes Refeição"
   - ✅ Mostra qual refeição foi detectada
   - ✅ Exibe o tempo de antecedência

### 2. Configuração Personalizada

No modal de configurações, o usuário pode:

- ✅ Ajustar o horário de cada uma das 6 refeições
- ✅ Alterar o tempo de antecedência (15-120 minutos)
- ✅ Salvar as preferências no banco de dados
- ✅ Sincronizar entre dispositivos

### 3. Flexibilidade

- ✅ Usuário pode sempre editar manualmente a condição
- ✅ Sugestão automática não é obrigatória
- ✅ Horários podem ser ajustados a qualquer momento

---

## ✅ Checklist Final

Após executar o script, marque:

- [ ] Script executado sem erros
- [ ] Colunas `meal_times` e `meal_advance_minutes` criadas
- [ ] Valores padrão verificados
- [ ] Teste de atualização realizado
- [ ] Frontend testado (modal de registro)
- [ ] Frontend testado (modal de configurações)
- [ ] Sistema funcionando corretamente

---

## 🎯 Próximos Passos

Após executar o script com sucesso:

1. ✅ Testar modal de novo registro (detecção automática)
2. ✅ Testar modal de configurações (edição de horários)
3. ✅ Verificar sincronização entre dispositivos
4. ✅ Ajustar horários conforme sua rotina
5. ✅ Validar experiência do usuário

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique as mensagens de erro no SQL Editor
2. Consulte a seção Troubleshooting acima
3. Verifique se a tabela `profiles` existe
4. Execute o script `003_create_profiles.sql` se necessário

---

**✨ Script pronto para uso!**

*Data de criação: 09/02/2026*
