-- AlterTable: add product_name column to sale_items
ALTER TABLE "sale_items" ADD COLUMN "product_name" TEXT NOT NULL DEFAULT '';

-- Backfill: populate product_name from products table for existing records
UPDATE "sale_items" si
SET "product_name" = p."name"
FROM "products" p
WHERE si."product_id" = p."id" AND si."product_name" = '';
