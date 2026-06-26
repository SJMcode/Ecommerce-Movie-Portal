/*
  Warnings:

  - A unique constraint covering the columns `[imdbId]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Person_name_key";

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "imdbId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Person_imdbId_key" ON "Person"("imdbId");
