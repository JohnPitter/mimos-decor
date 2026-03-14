# Plano de Implementação: Finanças + Menu Avatar + Skeleton Imagens

## Objetivo
1. **Controle Financeiro** — página completa de contas a pagar/receber com categorias customizáveis, recorrência, e notificações de vencimento (badge sidebar + toast login)
2. **Menu Avatar** — dropdown no Header com "Perfil" e "Sair"
3. **Skeleton em Imagens** — substituir carregamento progressivo por skeleton loading

---

## Arquivos Afetados

### Backend
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `packages/api/prisma/schema.prisma` | Modificar | Adicionar modelos FinanceCategory e FinanceEntry + enums |
| `packages/shared/src/constants.ts` | Modificar | Adicionar permissões finances:* e API_ROUTES |
| `packages/shared/src/types/finance.ts` | Criar | Tipos FinanceCategory, FinanceEntry, inputs |
| `packages/shared/src/types/index.ts` | Modificar | Exportar finance types |
| `packages/api/src/services/finance.service.ts` | Criar | CRUD + lógica recorrência + notifications |
| `packages/api/src/routes/finances.ts` | Criar | Rotas REST para finanças |
| `packages/api/src/index.ts` | Modificar | Registrar financeRouter |

### Frontend
| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `packages/web/src/stores/finance.store.ts` | Criar | Store Zustand para finanças |
| `packages/web/src/pages/Finances.tsx` | Criar | Página principal com cards, filtros, tabela |
| `packages/web/src/components/finances/FinanceFormDialog.tsx` | Criar | Dialog criar/editar conta |
| `packages/web/src/components/finances/CategoryManagerDialog.tsx` | Criar | Dialog gerenciar categorias |
| `packages/web/src/components/layout/Header.tsx` | Modificar | Dropdown avatar com Perfil/Sair |
| `packages/web/src/components/layout/Sidebar.tsx` | Modificar | Badge de notificações |
| `packages/web/src/components/common/ImageWithSkeleton.tsx` | Criar | Componente imagem com skeleton |
| `packages/web/src/App.tsx` | Modificar | Adicionar rota /app/finances |
| `packages/web/src/i18n/locales/pt-BR.ts` | Modificar | Strings de finanças |
| `packages/web/src/i18n/locales/en.ts` | Modificar | Strings de finanças |

---

## Ordem de Implementação
1. Types (shared) → 2. Schema (prisma) → 3. Constants → 4. Service (backend) → 5. Routes (backend) → 6. Store (frontend) → 7. Componentes + Página → 8. Header menu → 9. Skeleton imagens → 10. i18n
