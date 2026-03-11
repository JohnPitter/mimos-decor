# Plano: Toasts, Settings, Product Images, Charts

## 1. Substituir alert/confirm por Toasts

**Lib:** Sonner (leve, boa DX, sem dependências pesadas)

**Arquivos:**
- `packages/web/package.json` — adicionar `sonner`
- `packages/web/src/App.tsx` — adicionar `<Toaster />` global
- `packages/web/src/components/common/ConfirmDialog.tsx` — novo componente modal de confirmação
- `packages/web/src/pages/Products.tsx` — trocar confirm/alert por ConfirmDialog + toast
- `packages/web/src/pages/Users.tsx` — trocar confirm/alert
- `packages/web/src/pages/Gateways.tsx` — trocar confirm/alert

## 2. Fix Product Delete 500

**Causa:** Foreign key constraint — SaleItem referencia Product sem onDelete.
**Solução:** Ao deletar produto, setar `productId = null` nos SaleItems (SET NULL) ou simplesmente dar erro amigável.
**Decisão do user:** "um registro de venda nao pode ser atrelado a um produto" → desacoplar. Usar SET NULL.

**Arquivos:**
- `packages/api/prisma/schema.prisma` — SaleItem.product: optional + onDelete: SetNull
- Migration nova
- `packages/api/src/services/product.service.ts` — remover check de sales, deixar cascade SetNull resolver

## 3. Página de Configurações (Cores do Layout)

**Arquivos:**
- `packages/web/src/pages/Settings.tsx` — nova página
- `packages/web/src/stores/settings.store.ts` — Zustand store com persistência localStorage
- `packages/web/src/styles.css` — cores aplicadas via CSS variables dinâmicas
- `packages/web/src/App.tsx` — rota /app/settings
- `packages/web/src/components/layout/Sidebar.tsx` — nav item
- i18n locales — chaves de settings

## 4. Imagens de Produtos

**Arquivos:**
- `packages/api/prisma/schema.prisma` — campo `imageUrl String?` no Product
- Migration nova
- `packages/shared/src/types/product.ts` — campo imageUrl no tipo Product
- `packages/api/src/routes/products.ts` — endpoint upload de imagem
- `packages/api/src/services/product.service.ts` — salvar imageUrl
- `packages/web/src/components/products/ProductFormDialog.tsx` — input de imagem
- `packages/web/src/pages/Dashboard.tsx` — ícones no chart de top produtos

## 5. Top Products Chart — até 50 com seletor

**Arquivos:**
- `packages/api/src/services/dashboard.service.ts` — aceitar param `topN`
- `packages/api/src/routes/dashboard.ts` — passar query param
- `packages/web/src/stores/dashboard.store.ts` — passar topN
- `packages/web/src/pages/Dashboard.tsx` — seletor + BarChart ao invés de PieChart para 50 items
