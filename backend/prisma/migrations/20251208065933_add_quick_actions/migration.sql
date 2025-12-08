-- CreateTable
CREATE TABLE "quick_actions" (
    "id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quick_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quick_actions_household_id_ord_idx" ON "quick_actions"("household_id", "ord");

-- AddForeignKey
ALTER TABLE "quick_actions" ADD CONSTRAINT "quick_actions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
