-- Criar tabela de registros de glicemia
CREATE TABLE IF NOT EXISTS public.glucose_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reading_value INTEGER NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('jejum', 'antes_refeicao', 'apos_refeicao', 'ao_dormir', 'outro')),
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para glucose_readings
CREATE POLICY "Usuários podem ver seus próprios registros"
  ON public.glucose_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios registros"
  ON public.glucose_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios registros"
  ON public.glucose_readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios registros"
  ON public.glucose_readings FOR DELETE
  USING (auth.uid() = user_id);

-- Criar índices para melhor performance
CREATE INDEX idx_glucose_readings_user_id ON public.glucose_readings(user_id);
CREATE INDEX idx_glucose_readings_date ON public.glucose_readings(reading_date DESC);
CREATE INDEX idx_glucose_readings_user_date ON public.glucose_readings(user_id, reading_date DESC);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_glucose_readings_updated_at
  BEFORE UPDATE ON public.glucose_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
