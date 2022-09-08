/*
  Warnings:

  - A unique constraint covering the columns `[rank]` on the table `Templates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Templates" ADD COLUMN     "rank" SERIAL NOT NULL,
ALTER COLUMN "comment" DROP NOT NULL,
ALTER COLUMN "block" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Templates_rank_key" ON "Templates"("rank");
