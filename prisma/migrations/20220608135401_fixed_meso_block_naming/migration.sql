/*
  Warnings:

  - You are about to drop the column `mesocycle` on the `Templates` table. All the data in the column will be lost.
  - Added the required column `block` to the `Templates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Templates" DROP COLUMN "mesocycle",
ADD COLUMN     "block" TEXT NOT NULL;
