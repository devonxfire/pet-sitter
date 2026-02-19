/*
  Warnings:

  - You are about to drop the column `description` on the `food_inventory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "food_inventory" DROP COLUMN "description",
ADD COLUMN     "other" TEXT,
ADD COLUMN     "unitPerServing" DOUBLE PRECISION,
ADD COLUMN     "unitPerServingType" TEXT,
ADD COLUMN     "weightKg" DOUBLE PRECISION;
