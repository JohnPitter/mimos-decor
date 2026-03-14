-- AlterTable
ALTER TABLE "sales" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "sales" ADD COLUMN "sale_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill sale_date from created_at for existing records
UPDATE "sales" SET "sale_date" = "created_at" WHERE "sale_date" = CURRENT_TIMESTAMP;
