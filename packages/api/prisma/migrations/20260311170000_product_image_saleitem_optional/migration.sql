-- AlterTable: add image_url to products
ALTER TABLE "products" ADD COLUMN "image_url" TEXT;

-- AlterTable: make product_id nullable on sale_items
ALTER TABLE "sale_items" ALTER COLUMN "product_id" DROP NOT NULL;

-- DropForeignKey: remove old constraint
ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "sale_items_product_id_fkey";

-- AddForeignKey: re-add with ON DELETE SET NULL
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
