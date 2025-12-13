-- Habilitar o Storage criando um bucket privado chamado 'user_data'
-- Você pode rodar isso no SQL Editor do Supabase

-- 1. Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_data', 'user_data', false)
ON CONFLICT (id) DO NOTHING;

-- OBS: Não precisamos executar 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;' 
-- pois ela já é habilitada por padrão no Supabase e pode causar erro de permissão.

-- 2. Remove políticas antigas (caso existam) para evitar erro de duplicação ao rodar novamente
DROP POLICY IF EXISTS "Permitir leitura de arquivos do próprio usuário" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de arquivos do próprio usuário" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de arquivos do próprio usuário" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deletar arquivos do próprio usuário" ON storage.objects;

-- 3. Política para permitir que o usuário faça SELECT (ler) apenas na sua própria pasta
-- O caminho do arquivo será: user_data/{user_id}/medical_events.json
CREATE POLICY "Permitir leitura de arquivos do próprio usuário"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user_data' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Política para permitir INSERT (criar) arquivos na própria pasta
CREATE POLICY "Permitir upload de arquivos do próprio usuário"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user_data' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Política para permitir UPDATE (atualizar) arquivos na própria pasta
CREATE POLICY "Permitir atualização de arquivos do próprio usuário"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user_data' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Política para permitir DELETE (se necessário)
CREATE POLICY "Permitir deletar arquivos do próprio usuário"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user_data' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
