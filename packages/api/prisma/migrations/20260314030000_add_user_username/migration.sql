-- AlterTable: add username column (nullable first for backfill)
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Backfill: extract username from email (part before @)
UPDATE "users" SET "username" = LOWER(SPLIT_PART("email", '@', 1));

-- Handle duplicates by appending row number
WITH dupes AS (
  SELECT id, username, ROW_NUMBER() OVER (PARTITION BY username ORDER BY "created_at") as rn
  FROM "users"
)
UPDATE "users" SET "username" = "users"."username" || (dupes.rn - 1)
FROM dupes
WHERE "users".id = dupes.id AND dupes.rn > 1;

-- Make NOT NULL and add unique constraint
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
