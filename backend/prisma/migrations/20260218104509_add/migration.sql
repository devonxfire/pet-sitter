-- CreateTable
CREATE TABLE "food_inventory" (
    "id" SERIAL NOT NULL,
    "household_id" INTEGER NOT NULL,
    "foodType" TEXT NOT NULL,
    "brand" TEXT,
    "description" TEXT,
    "totalStock" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_food_link" (
    "id" SERIAL NOT NULL,
    "pet_id" INTEGER NOT NULL,
    "food_inventory_id" INTEGER NOT NULL,
    "portionSize" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_food_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "food_inventory_household_id_foodType_idx" ON "food_inventory"("household_id", "foodType");

-- CreateIndex
CREATE INDEX "pet_food_link_pet_id_food_inventory_id_idx" ON "pet_food_link"("pet_id", "food_inventory_id");

-- AddForeignKey
ALTER TABLE "food_inventory" ADD CONSTRAINT "food_inventory_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_food_link" ADD CONSTRAINT "pet_food_link_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_food_link" ADD CONSTRAINT "pet_food_link_food_inventory_id_fkey" FOREIGN KEY ("food_inventory_id") REFERENCES "food_inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
