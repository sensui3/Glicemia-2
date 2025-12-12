-- Adicionar campos para medicações de uso contínuo
ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS is_continuous BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS continuous_dosage NUMERIC,
ADD COLUMN IF NOT EXISTS continuous_dosage_unit TEXT CHECK (continuous_dosage_unit IN ('UI', 'mg', 'ml', 'comprimido')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Comentários para documentação
COMMENT ON COLUMN public.medications.is_continuous IS 'Indica se é uma medicação de uso contínuo';
COMMENT ON COLUMN public.medications.continuous_dosage IS 'Dosagem padrão para medicação contínua';
COMMENT ON COLUMN public.medications.continuous_dosage_unit IS 'Unidade da dosagem contínua';
COMMENT ON COLUMN public.medications.is_active IS 'Indica se a medicação contínua está ativa';
