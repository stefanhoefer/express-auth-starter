-- AlterTable
ALTER TABLE "Templates" ALTER COLUMN "rank" DROP DEFAULT;
DROP SEQUENCE "Templates_rank_seq";
