# 🔒 Guia de Execução - Script LGPD no Supabase

## ✅ Versão Segura - Sem Operações Destrutivas

Este guia explica como executar o script `006_lgpd_compliance.sql` de forma segura no Supabase.

---

## 🛡️ O que foi Corrigido

### ❌ Versão Anterior (Alertas do Supabase):
- Usava `DROP TRIGGER IF EXISTS` (operação destrutiva)
- Usava `DROP POLICY IF EXISTS` (operação destrutiva)
- Poderia remover triggers/policies existentes

### ✅ Versão Nova (100% Segura):
- ✅ Usa apenas `CREATE IF NOT EXISTS`
- ✅ Verifica existência antes de criar
- ✅ Não remove nada existente
- ✅ Tratamento de erros robusto
- ✅ Mensagens informativas
- ✅ Pode ser executado múltiplas vezes sem problemas

---

## 📋 Passo a Passo para Executar

### 1️⃣ Acessar o Supabase SQL Editor

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2️⃣ Copiar o Script

1. Abra o arquivo `scripts/006_lgpd_compliance.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)

### 3️⃣ Executar o Script

1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução (pode levar 5-10 segundos)
3. Verifique as mensagens de sucesso

### 4️⃣ Verificar Mensagens de Sucesso

Você deve ver mensagens como:

```
NOTICE: Trigger audit_glucose_readings criado com sucesso
NOTICE: Trigger audit_meals criado com sucesso
NOTICE: Triggers de auditoria configurados com sucesso
NOTICE: ✅ Script LGPD executado com sucesso!
NOTICE: 📋 Tabelas criadas: user_consents, audit_logs
NOTICE: 🔧 Funções criadas: export_user_data, delete_user_data_gdpr, check_user_consent
NOTICE: 🔒 RLS Policies aplicadas
NOTICE: ✨ Sistema pronto para compliance LGPD
```

---

## ✅ Verificação Pós-Execução

### Verificar Tabelas Criadas

Execute no SQL Editor:

```sql
-- Verificar tabela user_consents
SELECT * FROM user_consents LIMIT 1;

-- Verificar tabela audit_logs
SELECT * FROM audit_logs LIMIT 1;
```

**Resultado esperado:** Tabelas existem (mesmo que vazias)

### Verificar Funções Criadas

Execute no SQL Editor:

```sql
-- Listar funções LGPD
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'export_user_data',
    'delete_user_data_gdpr',
    'check_user_consent',
    'log_audit_trail'
  );
```

**Resultado esperado:** 4 funções listadas

### Verificar Triggers

Execute no SQL Editor:

```sql
-- Listar triggers de auditoria
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE 'audit_%'
ORDER BY event_object_table;
```

**Resultado esperado:** Triggers em todas as tabelas sensíveis

### Verificar RLS Policies

Execute no SQL Editor:

```sql
-- Verificar policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_consents', 'audit_logs')
ORDER BY tablename, policyname;
```

**Resultado esperado:** Policies de SELECT, INSERT, UPDATE

---

## 🔄 Executar Novamente (Se Necessário)

**É SEGURO executar o script múltiplas vezes!**

O script verifica se cada item já existe antes de criar:
- ✅ Tabelas: `CREATE TABLE IF NOT EXISTS`
- ✅ Índices: `CREATE INDEX IF NOT EXISTS`
- ✅ Triggers: Verifica existência antes de criar
- ✅ Policies: Verifica existência antes de criar

---

## 🧪 Testar Funcionalidades

### Teste 1: Exportar Dados (Vazio)

```sql
-- Testar exportação (substitua pelo seu user_id)
SELECT export_user_data('seu-user-id-aqui');
```

**Resultado esperado:** JSON com arrays vazios

### Teste 2: Verificar Consentimento

```sql
-- Testar verificação de consentimento
SELECT check_user_consent('seu-user-id-aqui', 'terms');
```

**Resultado esperado:** `false` (ainda não há consentimentos)

### Teste 3: Auditoria Automática

```sql
-- Inserir um registro de teste (substitua user_id)
INSERT INTO user_consents (user_id, consent_type, consent_given)
VALUES ('seu-user-id-aqui', 'terms', true);

-- Verificar se foi auditado
SELECT * FROM audit_logs 
WHERE table_name = 'user_consents' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado esperado:** Log de auditoria criado automaticamente

---

## ⚠️ Troubleshooting

### Erro: "relation already exists"

**Causa:** Tabela já existe (normal se executar múltiplas vezes)

**Solução:** Ignore, o script continua normalmente

### Erro: "trigger already exists"

**Causa:** Trigger já existe (normal se executar múltiplas vezes)

**Solução:** Ignore, o script continua normalmente

### Erro: "permission denied"

**Causa:** Usuário sem permissões adequadas

**Solução:** 
1. Certifique-se de estar logado como owner do projeto
2. Verifique permissões no Supabase Dashboard

### Erro: "table does not exist"

**Causa:** Tabela referenciada não existe ainda

**Solução:**
1. Verifique se as tabelas principais existem (glucose_readings, meals, etc.)
2. Execute os scripts anteriores (001, 002, 003, 004, 005) se necessário

---

## 📊 Estrutura Criada

### Tabelas

| Tabela | Descrição | Registros Esperados |
|--------|-----------|---------------------|
| `user_consents` | Consentimentos LGPD | 1 por usuário por tipo |
| `audit_logs` | Logs de auditoria | Cresce com uso |

### Funções

| Função | Parâmetros | Retorno | Uso |
|--------|------------|---------|-----|
| `export_user_data` | `p_user_id UUID` | `JSONB` | Exportar dados |
| `delete_user_data_gdpr` | `p_user_id UUID` | `JSONB` | Excluir conta |
| `check_user_consent` | `p_user_id UUID, p_consent_type TEXT` | `BOOLEAN` | Verificar consentimento |
| `log_audit_trail` | - | `TRIGGER` | Auditoria automática |

### Triggers

| Trigger | Tabela | Ação |
|---------|--------|------|
| `audit_glucose_readings` | glucose_readings | INSERT/UPDATE/DELETE |
| `audit_meals` | meals | INSERT/UPDATE/DELETE |
| `audit_medications` | medications | INSERT/UPDATE/DELETE |
| `audit_doctors` | doctors | INSERT/UPDATE/DELETE |
| `audit_medical_appointments` | medical_appointments | INSERT/UPDATE/DELETE |
| `audit_user_profiles` | user_profiles | INSERT/UPDATE/DELETE |

---

## ✅ Checklist Final

Após executar o script, marque:

- [ ] Script executado sem erros
- [ ] Mensagens de sucesso visualizadas
- [ ] Tabelas `user_consents` e `audit_logs` criadas
- [ ] Funções LGPD criadas (4 funções)
- [ ] Triggers de auditoria criados (6 triggers)
- [ ] RLS Policies aplicadas
- [ ] Testes básicos executados
- [ ] Sistema pronto para uso

---

## 🎯 Próximos Passos

Após executar o script com sucesso:

1. ✅ Testar modal de consentimento no frontend
2. ✅ Testar exportação de dados
3. ✅ Testar exclusão de conta (em ambiente de dev!)
4. ✅ Revisar textos legais com jurídico
5. ✅ Deploy em produção

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique as mensagens de erro no SQL Editor
2. Consulte a seção Troubleshooting acima
3. Verifique se todas as tabelas principais existem
4. Execute os scripts anteriores se necessário

---

**✨ Script 100% seguro e pronto para uso!**

*Última atualização: 16/12/2025*
