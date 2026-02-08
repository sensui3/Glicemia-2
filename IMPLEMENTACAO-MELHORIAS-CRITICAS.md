---
description: Implementação de Server-Side Pagination, Virtualização e LGPD Compliance
---

# Plano de Implementação - Melhorias Críticas

## 🎯 Objetivos

1. **Server-Side Pagination** - Redução de 80% no tempo de carregamento para datasets grandes
2. **Virtualização de Tabelas** - 95% redução em DOM nodes com @tanstack/react-virtual
3. **LGPD Compliance** - Políticas de privacidade e consentimento granular

---

## 📊 Fase 1: Server-Side Pagination

### Análise de Impacto
- **Arquivos Afetados**: 
  - `hooks/use-glucose.ts` (modificação)
  - `components/dashboard-content.tsx` (modificação)
  - `components/glucose-table.tsx` (modificação leve)
  
- **Riscos**: 
  - ⚠️ Mudança na estrutura de retorno do hook
  - ⚠️ Necessidade de ajustar lógica de cache do TanStack Query
  - ✅ Não afeta componentes de visualização (charts)

### Implementação

#### 1.1 Atualizar Hook `use-glucose.ts`
```typescript
// Adicionar suporte para paginação server-side
export function useGlucoseReadingsPaginated({
  userId,
  page = 1,
  limit = 15,
  filter,
  periodFilter,
  tagFilter,
  startDate,
  endDate,
  sortBy = 'reading_date',
  sortOrder = 'desc'
}: UseGlucosePaginatedOptions) {
  return useQuery({
    queryKey: GLUCOSE_KEYS.list(`${userId}-${filter}-${page}-${limit}-${sortOrder}`),
    queryFn: async () => {
      const supabase = createClient()
      const offset = (page - 1) * limit
      
      // Query com paginação
      let query = supabase
        .from("glucose_readings")
        .select("*", { count: 'exact' })
        .eq("user_id", userId)
        .range(offset, offset + limit - 1)
        .order(sortBy, { ascending: sortOrder === 'asc' })
      
      // Aplicar filtros...
      
      const { data, error, count } = await query
      
      return {
        data: data as GlucoseReading[],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      }
    }
  })
}
```

#### 1.2 Manter Hook Original para Charts
```typescript
// Manter useGlucoseReadings para gráficos (sem paginação)
// Usado apenas para visualizações que precisam de todo o dataset
```

---

## 🖥️ Fase 2: Virtualização de Tabelas

### Análise de Impacto
- **Arquivos Afetados**:
  - `components/glucose-table.tsx` (refatoração significativa)
  - `components/glucose-table-medical.tsx` (refatoração significativa)
  
- **Dependência**: `@tanstack/react-virtual` (já compatível com TanStack Query)

### Implementação

#### 2.1 Instalar Dependência
```bash
npm install @tanstack/react-virtual
```

#### 2.2 Refatorar GlucoseTable
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export function GlucoseTable({ readings, ... }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const rowVirtualizer = useVirtualizer({
    count: readings.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // altura estimada da linha
    overscan: 5 // renderizar 5 itens extras fora da viewport
  })
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const reading = readings[virtualRow.index]
          return (
            <div
              key={reading.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {/* Conteúdo da linha */}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## 🔒 Fase 3: LGPD Compliance

### Análise de Impacto
- **Arquivos Novos**:
  - `app/privacy/page.tsx` (nova página)
  - `app/terms/page.tsx` (nova página)
  - `components/lgpd-consent-modal.tsx` (novo componente)
  - `components/data-export-dialog.tsx` (novo componente)
  - `scripts/006_lgpd_compliance.sql` (novo script)
  
- **Arquivos Modificados**:
  - `app/layout.tsx` (adicionar modal de consentimento)
  - `components/settings-modal.tsx` (adicionar opções LGPD)

### Implementação

#### 3.1 Criar Tabelas de Auditoria
```sql
-- scripts/006_lgpd_compliance.sql
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'terms', 'privacy', 'data_processing'
  consent_given BOOLEAN NOT NULL,
  consent_date TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT
);

-- Índices para performance
CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

#### 3.2 Componente de Consentimento
```typescript
// components/lgpd-consent-modal.tsx
export function LGPDConsentModal() {
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    dataProcessing: false
  })
  
  // Verificar se usuário já deu consentimento
  // Exibir modal apenas se necessário
  
  return (
    <Dialog open={!hasConsent}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Consentimento de Uso de Dados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox 
              checked={consents.terms}
              onCheckedChange={(checked) => 
                setConsents(prev => ({ ...prev, terms: checked as boolean }))
              }
            />
            <div>
              <Label>Aceito os Termos de Uso</Label>
              <Link href="/terms" className="text-sm text-primary">
                Ler termos completos
              </Link>
            </div>
          </div>
          
          {/* Outros consentimentos... */}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.3 Exportação de Dados (Direito à Portabilidade)
```typescript
// components/data-export-dialog.tsx
export function DataExportDialog() {
  const handleExport = async () => {
    const response = await fetch('/api/user/export-data', {
      method: 'POST'
    })
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meus-dados-${new Date().toISOString()}.json`
    a.click()
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Exportar Meus Dados</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Dados Pessoais</DialogTitle>
          <DialogDescription>
            Você receberá um arquivo JSON com todos os seus dados armazenados.
          </DialogDescription>
        </DialogHeader>
        <Button onClick={handleExport}>Baixar Dados</Button>
      </DialogContent>
    </Dialog>
  )
}
```

#### 3.4 Direito ao Esquecimento
```typescript
// Adicionar em settings-modal.tsx
const handleDeleteAccount = async () => {
  if (confirm('Tem certeza? Esta ação é irreversível.')) {
    await supabase.rpc('delete_user_data_gdpr', { user_id: userId })
    await supabase.auth.signOut()
    router.push('/')
  }
}
```

```sql
-- Função para deletar todos os dados do usuário
CREATE OR REPLACE FUNCTION delete_user_data_gdpr(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Deletar em ordem de dependências
  DELETE FROM glucose_readings WHERE user_id = p_user_id;
  DELETE FROM meals WHERE user_id = p_user_id;
  DELETE FROM medications WHERE user_id = p_user_id;
  DELETE FROM doctors WHERE user_id = p_user_id;
  DELETE FROM medical_appointments WHERE user_id = p_user_id;
  DELETE FROM user_profiles WHERE id = p_user_id;
  DELETE FROM audit_logs WHERE user_id = p_user_id;
  DELETE FROM user_consents WHERE user_id = p_user_id;
  
  -- Deletar usuário do auth
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Checklist de Implementação

### Fase 1: Server-Side Pagination
- [ ] Criar novo hook `useGlucoseReadingsPaginated`
- [ ] Atualizar `dashboard-content.tsx` para usar novo hook
- [ ] Manter hook original para charts
- [ ] Testar paginação com diferentes filtros
- [ ] Verificar performance com datasets grandes

### Fase 2: Virtualização
- [ ] Instalar `@tanstack/react-virtual`
- [ ] Refatorar `glucose-table.tsx`
- [ ] Refatorar `glucose-table-medical.tsx`
- [ ] Testar scroll e performance
- [ ] Garantir acessibilidade (keyboard navigation)

### Fase 3: LGPD
- [ ] Criar script SQL de compliance
- [ ] Executar migrations no Supabase
- [ ] Criar páginas de Termos e Privacidade
- [ ] Implementar modal de consentimento
- [ ] Adicionar exportação de dados
- [ ] Implementar direito ao esquecimento
- [ ] Criar logs de auditoria
- [ ] Testar fluxo completo

---

## 🧪 Testes Necessários

### Testes de Paginação
```typescript
describe('Server-Side Pagination', () => {
  it('should fetch correct page of data', async () => {
    const { result } = renderHook(() => 
      useGlucoseReadingsPaginated({ userId: 'test', page: 2, limit: 15 })
    )
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data.pagination.page).toBe(2)
  })
})
```

### Testes de LGPD
```typescript
describe('LGPD Compliance', () => {
  it('should show consent modal for new users', () => {
    render(<LGPDConsentModal />)
    expect(screen.getByText('Consentimento de Uso de Dados')).toBeInTheDocument()
  })
  
  it('should export user data', async () => {
    // Test data export functionality
  })
})
```

---

## 📈 Métricas de Sucesso

### Performance
- **Antes**: 500ms para carregar 5000 registros
- **Meta**: 50ms para carregar 15 registros (página)
- **Redução**: 90%

### DOM Nodes
- **Antes**: 5000 nodes para 1000 registros
- **Meta**: 250 nodes (apenas visíveis)
- **Redução**: 95%

### Compliance
- **Antes**: 0% compliance LGPD
- **Meta**: 100% compliance
- **Funcionalidades**: Consentimento, Exportação, Esquecimento, Auditoria

---

## ⚠️ Cuidados Especiais

1. **Backward Compatibility**: Manter hook original para não quebrar charts
2. **Cache Invalidation**: Garantir que paginação não quebre cache do TanStack Query
3. **Acessibilidade**: Virtualização não deve prejudicar navegação por teclado
4. **LGPD**: Consultar jurídico para textos de Termos e Privacidade
5. **Testes**: Testar cada fase isoladamente antes de integrar

---

*Plano criado em 16/12/2025*
