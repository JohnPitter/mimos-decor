-- Create roles table
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Add new columns to users
ALTER TABLE "users" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "role_id" TEXT;
ALTER TABLE "users" ADD COLUMN "permission_overrides" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "users" ADD COLUMN "theme_colors" JSONB;

-- Migrate existing admin users
UPDATE "users" SET "is_admin" = true WHERE "role" = 'ADMIN';

-- Create default "Operador" role with basic permissions
INSERT INTO "roles" ("id", "name", "permissions", "created_at", "updated_at")
VALUES (
    'default-operator',
    'Operador',
    ARRAY['dashboard:view', 'products:view', 'sales:view', 'sales:create', 'sales:updateStatus', 'reports:view'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Assign existing operators to the default role
UPDATE "users" SET "role_id" = 'default-operator' WHERE "role" = 'OPERATOR';

-- Add foreign key
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Drop old enum
DROP TYPE "UserRole";
