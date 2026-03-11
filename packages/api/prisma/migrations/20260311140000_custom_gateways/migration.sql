-- Convert gateway column from enum to text
ALTER TABLE "sales" ALTER COLUMN "gateway" TYPE TEXT USING ("gateway"::text);

-- Drop the Gateway enum (no longer needed)
DROP TYPE "Gateway";

-- Drop the gateway index and recreate it for text column
DROP INDEX IF EXISTS "sales_gateway_idx";
CREATE INDEX "sales_gateway_idx" ON "sales"("gateway");

-- Create custom_gateways table
CREATE TABLE "custom_gateways" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B5E5E',
    "base_gateway" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_gateways_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_gateways_slug_key" ON "custom_gateways"("slug");
