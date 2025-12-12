-- Adicionando campo para controlar visibilidade das medicações no dashboard
ALTER TABLE medications
ADD COLUMN show_in_dashboard BOOLEAN DEFAULT true;

-- Atualizando medicações existentes para aparecerem no dashboard por padrão
UPDATE medications
SET show_in_dashboard = true
WHERE is_continuous = true AND is_active = true;
