# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|

## User Preferences
- Prefers Portuguese for UI/communication
- Direct implementation without excessive planning for simple changes
- Push commits when asked without hesitation

## Patterns That Work
- Follow existing patterns exactly (product.service.ts → finance.service.ts)
- Build all 3 packages after changes to verify: `pnpm build`
- Use `pnpm --filter @mimos/api exec prisma generate` after schema changes
- Prisma local version is 6.4.0, global is 7.x — always use local

## Patterns That Don't Work
- `prisma migrate dev` fails without running PostgreSQL locally — create migration SQL manually
- Adding new DB columns without running migration on prod causes 500 errors — user must run `prisma migrate deploy` on server after deploy

## Domain Notes
- Monorepo: packages/api (Express+Prisma), packages/web (React+Vite), packages/shared (types+constants)
- Mimos Decor = e-commerce/artesanato management system
- All pages follow same pattern: Header + actions bar + table + dialogs
- SaleFormDialog has ProductPicker component for item selection
- DeliveryStatus enum: PENDING, PREPARING, IN_TRANSIT, DELIVERED, RETURNED, CANCELLED
