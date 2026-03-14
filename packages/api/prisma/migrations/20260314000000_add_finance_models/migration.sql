-- CreateEnum
CREATE TYPE "FinanceType" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "FinanceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'FINANCE_ENTRY';
ALTER TYPE "AuditEntity" ADD VALUE 'FINANCE_CATEGORY';

-- CreateTable
CREATE TABLE "finance_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B5E5E',
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_entries" (
    "id" TEXT NOT NULL,
    "type" "FinanceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "category_id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" "FinanceStatus" NOT NULL DEFAULT 'PENDING',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_months" INTEGER,
    "recurring_group_id" TEXT,
    "installment_number" INTEGER,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_entries_type_idx" ON "finance_entries"("type");

-- CreateIndex
CREATE INDEX "finance_entries_status_idx" ON "finance_entries"("status");

-- CreateIndex
CREATE INDEX "finance_entries_due_date_idx" ON "finance_entries"("due_date");

-- CreateIndex
CREATE INDEX "finance_entries_category_id_idx" ON "finance_entries"("category_id");

-- CreateIndex
CREATE INDEX "finance_entries_recurring_group_id_idx" ON "finance_entries"("recurring_group_id");

-- CreateIndex
CREATE INDEX "finance_entries_created_at_idx" ON "finance_entries"("created_at");

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
