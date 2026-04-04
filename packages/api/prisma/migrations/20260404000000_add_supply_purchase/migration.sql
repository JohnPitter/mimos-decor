-- CreateTable
CREATE TABLE "supply_purchases" (
    "id" TEXT NOT NULL,
    "supply_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supply_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supply_purchases_supply_id_idx" ON "supply_purchases"("supply_id");

-- CreateIndex
CREATE INDEX "supply_purchases_created_at_idx" ON "supply_purchases"("created_at");

-- AddForeignKey
ALTER TABLE "supply_purchases" ADD CONSTRAINT "supply_purchases_supply_id_fkey" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
