-- Add pricing params to custom_gateways
ALTER TABLE "custom_gateways" ADD COLUMN "tiers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "custom_gateways" ADD COLUMN "pix_tiers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "custom_gateways" ADD COLUMN "extra_fixed" DOUBLE PRECISION NOT NULL DEFAULT 0;
