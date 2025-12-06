/*
  Warnings:

  - A unique constraint covering the columns `[household_id,invited_email]` on the table `household_members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "household_members" ADD COLUMN     "invited_email" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "household_members_household_id_invited_email_key" ON "household_members"("household_id", "invited_email");
