-- ============================================
-- Script Adicional: Constraint Única para user_consents
-- ============================================
-- Este script adiciona uma constraint única para evitar
-- consentimentos duplicados por usuário e tipo
-- ============================================

-- Adicionar constraint única (se não existir)
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_consents_user_id_consent_type_key'
  ) THEN
    -- Antes de criar a constraint, remover possíveis duplicatas
    -- Mantém apenas o registro mais recente de cada combinação user_id + consent_type
    DELETE FROM user_consents
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY user_id, consent_type 
                 ORDER BY created_at DESC
               ) as rn
        FROM user_consents
      ) t
      WHERE t.rn > 1
    );
    
    RAISE NOTICE 'ℹ️ Duplicatas removidas (se existiam)';
    
    -- Criar constraint única
    ALTER TABLE user_consents 
    ADD CONSTRAINT user_consents_user_id_consent_type_key 
    UNIQUE (user_id, consent_type);
    
    RAISE NOTICE '✅ Constraint única criada: user_consents_user_id_consent_type_key';
  ELSE
    RAISE NOTICE 'ℹ️ Constraint única já existe';
  END IF;
END
$$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
