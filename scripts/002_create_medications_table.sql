-- Criar tabela de medicações
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  medication_type TEXT NOT NULL CHECK (medication_type IN ('insulina_rapida', 'insulina_lenta', 'insulina_intermediaria', 'outro_medicamento')),
  dosage NUMERIC NOT NULL,
  dosage_unit TEXT NOT NULL CHECK (dosage_unit IN ('UI', 'mg', 'ml', 'comprimido')),
  administration_date DATE NOT NULL,
  administration_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para medications
CREATE POLICY "Usuários podem ver suas próprias medicações"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias medicações"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias medicações"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias medicações"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_date ON public.medications(administration_date DESC);
CREATE INDEX idx_medications_user_date ON public.medications(user_id, administration_date DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
