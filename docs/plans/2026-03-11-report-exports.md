# Plano: Export de Relatórios (Excel + PDF)

## Objetivo
Adicionar exportação de relatórios de Vendas, Produtos e Dashboard em formatos Excel (.xlsx) e PDF (.pdf), com botões rápidos em cada página e uma página dedicada de Relatórios com filtros.

## Dependências
- `xlsx` (SheetJS) — geração de Excel no client-side
- `jspdf` + `jspdf-autotable` — geração de PDF no client-side

## Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `packages/web/package.json` | Modificar | Adicionar xlsx, jspdf, jspdf-autotable |
| `packages/web/src/lib/export-xlsx.ts` | Criar | Funções de geração Excel (vendas, produtos, dashboard) |
| `packages/web/src/lib/export-pdf.ts` | Criar | Funções de geração PDF (vendas, produtos, dashboard) |
| `packages/web/src/pages/Reports.tsx` | Criar | Página dedicada com filtros e cards de export |
| `packages/web/src/pages/Sales.tsx` | Modificar | Adicionar dropdown com botões Excel/PDF |
| `packages/web/src/pages/Products.tsx` | Modificar | Adicionar dropdown com botões Excel/PDF |
| `packages/web/src/pages/Dashboard.tsx` | Modificar | Adicionar dropdown com botões Excel/PDF |
| `packages/web/src/components/common/ExportDropdown.tsx` | Criar | Componente reutilizável de dropdown export |
| `packages/web/src/components/layout/Sidebar.tsx` | Modificar | Adicionar nav item "Relatórios" |
| `packages/web/src/App.tsx` | Modificar | Adicionar rota /app/reports |
| `packages/web/src/i18n/locales/pt-BR.ts` | Modificar | Adicionar chaves de i18n |
| `packages/web/src/i18n/locales/en.ts` | Modificar | Adicionar chaves de i18n |

## Ordem de Implementação
1. Instalar dependências
2. Criar `export-xlsx.ts` e `export-pdf.ts`
3. Criar `ExportDropdown.tsx`
4. Criar `Reports.tsx`
5. Atualizar Sidebar, App.tsx, i18n
6. Adicionar export buttons nas páginas existentes
7. Build + teste

## Detalhes Técnicos

### Excel (export-xlsx.ts)
- Header com cor primária do tema (fundo colorido, texto branco)
- Linhas alternadas (cinza claro)
- Formatação de moeda BRL
- Auto-width das colunas
- Conditional formatting: estoque baixo (<=5) vermelho, lucro negativo vermelho, positivo verde
- Cada tipo gera um workbook com 1+ abas

### PDF (export-pdf.ts)
- **Vendas/Produtos**: Header com nome do relatório + data + tabela estilizada
- **Dashboard**: Header + KPI cards (4) + tabelas (vendas por dia, top produtos, vendas por gateway)
- Usa cores do tema para header
- A4 landscape para tabelas largas
- jspdf-autotable para tabelas

### Reports.tsx
- Filtros: período (data início/fim), gateway, status, produto
- 3 cards de export (Vendas, Produtos, Dashboard)
- Cada card com botões Excel e PDF
- Busca dados via API com filtros aplicados antes de exportar

### ExportDropdown.tsx
- Botão com ícone Download
- Dropdown com opções "Excel" e "PDF"
- Recebe callbacks onExcel e onPdf
