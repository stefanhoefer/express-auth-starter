-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordSet" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" DROP NOT NULL;
