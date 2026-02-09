-- Adiciona configurações de horários de refeições e tempo de antecedência
-- Este campo permite que o usuário configure seus horários padrão de refeições
-- e o tempo de antecedência para sugestão automática no modal de registro

alter table public.profiles 
add column if not exists meal_times jsonb default '{
  "cafe_manha": "07:30",
  "lanche_manha": "10:00",
  "almoco": "12:00",
  "lanche_tarde": "15:00",
  "jantar": "18:00",
  "lanche_noturno": "21:00"
}'::jsonb;

alter table public.profiles 
add column if not exists meal_advance_minutes integer default 45;

comment on column public.profiles.meal_times is 'Horários padrão das refeições do usuário em formato HH:MM';
comment on column public.profiles.meal_advance_minutes is 'Tempo em minutos antes da refeição para sugestão automática (padrão: 45 minutos)';
