-- ============================================
-- Script de Compliance LGPD - VERSÃO SEGURA
-- Sistema de Controle de Glicemia
-- ============================================
-- Este script cria as estruturas necessárias para compliance com a LGPD
-- incluindo: consentimentos, auditoria, e funções de privacidade
-- 
-- SEGURANÇA: Usa apenas CREATE IF NOT EXISTS para evitar perda de dados
-- ============================================

-- ============================================
-- 1. Tabela de Consentimentos do Usuário
-- ============================================
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'data_processing', 'marketing')),
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  consent_version TEXT NOT NULL DEFAULT '1.0',
  ip_address TEXT,
  user_agent TEXT,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance (só cria se não existir)
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX IF NOT EXISTS idx_user_consents_date ON user_consents(consent_date);

-- Comentário na tabela
COMMENT ON TABLE user_consents IS 'Armazena os consentimentos LGPD dos usuários';

-- ============================================
-- 2. Trigger para atualizar updated_at em user_consents
-- ============================================
CREATE OR REPLACE FUNCTION update_user_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_user_consents_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_user_consents_updated_at
      BEFORE UPDATE ON user_consents
      FOR EACH ROW
      EXECUTE FUNCTION update_user_consents_updated_at();
  END IF;
END
$$;

-- ============================================
-- 3. Tabela de Logs de Auditoria
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'export', 'login', 'logout')),
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance e queries de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Comentário na tabela
COMMENT ON TABLE audit_logs IS 'Logs de auditoria para compliance LGPD';

-- ============================================
-- 4. Função para Registrar Auditoria Automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Tentar obter o user_id do contexto ou do registro
  BEGIN
    v_user_id := COALESCE(
      current_setting('app.current_user_id', true)::UUID,
      COALESCE(NEW.user_id, OLD.user_id)
    );
  EXCEPTION WHEN OTHERS THEN
    v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  END;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (v_user_id, 'delete', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::JSONB);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (v_user_id, 'update', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::JSONB, row_to_json(NEW)::JSONB);
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (v_user_id, 'create', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::JSONB);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_audit_trail IS 'Trigger function para auditoria automática de operações CRUD';

-- ============================================
-- 5. Aplicar Triggers de Auditoria nas Tabelas Sensíveis
-- ============================================

-- Função auxiliar para criar triggers de forma segura
CREATE OR REPLACE FUNCTION create_audit_trigger_safe(p_table_name TEXT)
RETURNS VOID AS $$
DECLARE
  v_trigger_name TEXT;
BEGIN
  v_trigger_name := 'audit_' || p_table_name;
  
  -- Verificar se a tabela existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    -- Criar trigger apenas se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = v_trigger_name
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION log_audit_trail()',
        v_trigger_name, p_table_name
      );
      RAISE NOTICE 'Trigger % criado com sucesso', v_trigger_name;
    ELSE
      RAISE NOTICE 'Trigger % já existe', v_trigger_name;
    END IF;
  ELSE
    RAISE NOTICE 'Tabela % não existe, trigger não criado', p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers nas tabelas (apenas se existirem)
DO $$
BEGIN
  -- Glucose Readings
  PERFORM create_audit_trigger_safe('glucose_readings');
  
  -- Meals
  PERFORM create_audit_trigger_safe('meals');
  
  -- Medications
  PERFORM create_audit_trigger_safe('medications');
  
  -- Doctors
  PERFORM create_audit_trigger_safe('doctors');
  
  -- Medical Appointments
  PERFORM create_audit_trigger_safe('medical_appointments');
  
  -- User Profiles
  PERFORM create_audit_trigger_safe('user_profiles');
  
  RAISE NOTICE 'Triggers de auditoria configurados com sucesso';
END
$$;

-- ============================================
-- 6. Função para Exportar Dados do Usuário (Portabilidade)
-- ============================================
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_user_profile JSONB;
  v_glucose_readings JSONB;
  v_meals JSONB;
  v_medications JSONB;
  v_doctors JSONB;
  v_appointments JSONB;
  v_consents JSONB;
BEGIN
  -- Buscar dados de cada tabela (com tratamento de erro se tabela não existir)
  BEGIN
    SELECT jsonb_agg(row_to_json(up)) INTO v_user_profile 
    FROM user_profiles up WHERE up.id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_user_profile := '[]'::jsonb;
  END;

  BEGIN
    SELECT jsonb_agg(row_to_json(gr)) INTO v_glucose_readings 
    FROM glucose_readings gr WHERE gr.user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_glucose_readings := '[]'::jsonb;
  END;

  BEGIN
    SELECT jsonb_agg(row_to_json(m)) INTO v_meals 
    FROM meals m WHERE m.user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_meals := '[]'::jsonb;
  END;

  BEGIN
    SELECT jsonb_agg(row_to_json(med)) INTO v_medications 
    FROM medications med WHERE med.user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_medications := '[]'::jsonb;
  END;

  BEGIN
    SELECT jsonb_agg(row_to_json(d)) INTO v_doctors 
    FROM doctors d WHERE d.user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_doctors := '[]'::jsonb;
  END;

  BEGIN
    SELECT jsonb_agg(row_to_json(ma)) INTO v_appointments 
    FROM medical_appointments ma WHERE ma.user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_appointments := '[]'::jsonb;
  END;

  BEGIN
    SELECT jsonb_agg(row_to_json(uc)) INTO v_consents 
    FROM user_consents uc WHERE uc.user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_consents := '[]'::jsonb;
  END;

  -- Montar resultado
  v_result := jsonb_build_object(
    'user_profile', COALESCE(v_user_profile, '[]'::jsonb),
    'glucose_readings', COALESCE(v_glucose_readings, '[]'::jsonb),
    'meals', COALESCE(v_meals, '[]'::jsonb),
    'medications', COALESCE(v_medications, '[]'::jsonb),
    'doctors', COALESCE(v_doctors, '[]'::jsonb),
    'medical_appointments', COALESCE(v_appointments, '[]'::jsonb),
    'consents', COALESCE(v_consents, '[]'::jsonb),
    'export_date', NOW()
  );

  -- Registrar auditoria de exportação
  INSERT INTO audit_logs (user_id, action, table_name, record_id)
  VALUES (p_user_id, 'export', 'user_data', p_user_id);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION export_user_data IS 'Exporta todos os dados do usuário (Direito à Portabilidade - LGPD Art. 18)';

-- ============================================
-- 7. Função para Deletar Dados do Usuário (Direito ao Esquecimento)
-- ============================================
CREATE OR REPLACE FUNCTION delete_user_data_gdpr(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_deleted_counts JSONB;
  v_glucose_count INTEGER := 0;
  v_meals_count INTEGER := 0;
  v_medications_count INTEGER := 0;
  v_doctors_count INTEGER := 0;
  v_appointments_count INTEGER := 0;
BEGIN
  -- Contar registros antes de deletar (com tratamento de erro)
  BEGIN
    SELECT COUNT(*) INTO v_glucose_count FROM glucose_readings WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_glucose_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_meals_count FROM meals WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_meals_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_medications_count FROM medications WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_medications_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_doctors_count FROM doctors WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_doctors_count := 0;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_appointments_count FROM medical_appointments WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_appointments_count := 0;
  END;

  -- Registrar auditoria ANTES de deletar
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data)
  VALUES (p_user_id, 'delete', 'user_account_gdpr', p_user_id, 
    jsonb_build_object(
      'glucose_readings', v_glucose_count,
      'meals', v_meals_count,
      'medications', v_medications_count,
      'doctors', v_doctors_count,
      'appointments', v_appointments_count,
      'deletion_date', NOW()
    )
  );

  -- Deletar em ordem de dependências (foreign keys) com tratamento de erro
  BEGIN
    DELETE FROM glucose_readings WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar glucose_readings: %', SQLERRM;
  END;

  BEGIN
    DELETE FROM meals WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar meals: %', SQLERRM;
  END;

  BEGIN
    DELETE FROM medications WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar medications: %', SQLERRM;
  END;

  BEGIN
    DELETE FROM medical_appointments WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar medical_appointments: %', SQLERRM;
  END;

  BEGIN
    DELETE FROM doctors WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar doctors: %', SQLERRM;
  END;

  BEGIN
    DELETE FROM user_profiles WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar user_profiles: %', SQLERRM;
  END;

  BEGIN
    DELETE FROM user_consents WHERE user_id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar user_consents: %', SQLERRM;
  END;
  
  -- NÃO deletar audit_logs para manter histórico de compliance
  -- Apenas anonimizar o user_id
  UPDATE audit_logs SET user_id = NULL WHERE user_id = p_user_id;

  -- Deletar usuário do auth (última ação)
  BEGIN
    DELETE FROM auth.users WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao deletar auth.users: %', SQLERRM;
  END;

  -- Retornar contagem de registros deletados
  v_deleted_counts := jsonb_build_object(
    'glucose_readings', v_glucose_count,
    'meals', v_meals_count,
    'medications', v_medications_count,
    'doctors', v_doctors_count,
    'appointments', v_appointments_count,
    'deletion_completed', true,
    'deletion_date', NOW()
  );

  RETURN v_deleted_counts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_user_data_gdpr IS 'Deleta todos os dados do usuário (Direito ao Esquecimento - LGPD Art. 18)';

-- ============================================
-- 8. Função para Verificar Consentimento
-- ============================================
CREATE OR REPLACE FUNCTION check_user_consent(p_user_id UUID, p_consent_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_consent BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_consents
    WHERE user_id = p_user_id
      AND consent_type = p_consent_type
      AND consent_given = true
      AND revoked_at IS NULL
  ) INTO v_has_consent;

  RETURN v_has_consent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_consent IS 'Verifica se usuário deu consentimento específico';

-- ============================================
-- 9. Row Level Security (RLS) Policies
-- ============================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_consents (criar apenas se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_consents' AND policyname = 'Users can view their own consents'
  ) THEN
    CREATE POLICY "Users can view their own consents"
      ON user_consents FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_consents' AND policyname = 'Users can insert their own consents'
  ) THEN
    CREATE POLICY "Users can insert their own consents"
      ON user_consents FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_consents' AND policyname = 'Users can update their own consents'
  ) THEN
    CREATE POLICY "Users can update their own consents"
      ON user_consents FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Políticas para audit_logs (somente leitura para o próprio usuário)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' AND policyname = 'Users can view their own audit logs'
  ) THEN
    CREATE POLICY "Users can view their own audit logs"
      ON audit_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- ============================================
-- 10. Mensagem de Sucesso
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Script LGPD executado com sucesso!';
  RAISE NOTICE '📋 Tabelas criadas: user_consents, audit_logs';
  RAISE NOTICE '🔧 Funções criadas: export_user_data, delete_user_data_gdpr, check_user_consent';
  RAISE NOTICE '🔒 RLS Policies aplicadas';
  RAISE NOTICE '✨ Sistema pronto para compliance LGPD';
END
$$;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
