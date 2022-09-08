/*
  Warnings:

  - The `equipment` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `muscleGroups` column on the `Exercise` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `type` on the `Exercise` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `movementPattern` on table `Exercise` required. This step will fail if there are existing NULL values in that column.
  - Made the column `comment` on table `Exercise` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "equipment",
ADD COLUMN     "equipment" TEXT[],
DROP COLUMN "muscleGroups",
ADD COLUMN     "muscleGroups" JSONB[],
ALTER COLUMN "movementPattern" SET NOT NULL,
ALTER COLUMN "comment" SET NOT NULL;

-- DropEnum
DROP TYPE "ExerciseType";
