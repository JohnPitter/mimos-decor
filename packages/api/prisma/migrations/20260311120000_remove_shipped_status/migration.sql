-- Migrate any SHIPPED rows to IN_TRANSIT before removing the enum value
UPDATE "sales" SET "delivery_status" = 'IN_TRANSIT' WHERE "delivery_status" = 'SHIPPED';
UPDATE "delivery_status_history" SET "from_status" = 'IN_TRANSIT' WHERE "from_status" = 'SHIPPED';
UPDATE "delivery_status_history" SET "to_status" = 'IN_TRANSIT' WHERE "to_status" = 'SHIPPED';

-- Remove SHIPPED from the DeliveryStatus enum
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'PREPARING', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED');

ALTER TABLE "sales" ALTER COLUMN "delivery_status" DROP DEFAULT;
ALTER TABLE "sales" ALTER COLUMN "delivery_status" TYPE "DeliveryStatus" USING ("delivery_status"::text::"DeliveryStatus");
ALTER TABLE "sales" ALTER COLUMN "delivery_status" SET DEFAULT 'PENDING';

ALTER TABLE "delivery_status_history" ALTER COLUMN "from_status" TYPE "DeliveryStatus" USING ("from_status"::text::"DeliveryStatus");
ALTER TABLE "delivery_status_history" ALTER COLUMN "to_status" TYPE "DeliveryStatus" USING ("to_status"::text::"DeliveryStatus");

DROP TYPE "DeliveryStatus_old";
