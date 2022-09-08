/*
  Warnings:

  - A unique constraint covering the columns `[rank]` on the table `TemplateFolder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Templates" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFolder_rank_key" ON "TemplateFolder"("rank");
