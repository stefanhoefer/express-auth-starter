/*
  Warnings:

  - You are about to drop the `Templates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Templates" DROP CONSTRAINT "Templates_templateFolderId_fkey";

-- DropForeignKey
ALTER TABLE "Templates" DROP CONSTRAINT "Templates_userId_fkey";

-- DropForeignKey
ALTER TABLE "_SharedWith" DROP CONSTRAINT "_SharedWith_A_fkey";

-- DropTable
DROP TABLE "Templates";

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedAt" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "block" TEXT,
    "userId" TEXT NOT NULL,
    "templateFolderId" TEXT,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Template_id_key" ON "Template"("id");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_templateFolderId_fkey" FOREIGN KEY ("templateFolderId") REFERENCES "TemplateFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedWith" ADD CONSTRAINT "_SharedWith_A_fkey" FOREIGN KEY ("A") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
