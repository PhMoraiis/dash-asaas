/*
  Warnings:

  - You are about to drop the column `externalId` on the `produtos` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `revendas` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "revendas_externalId_key";

-- AlterTable
ALTER TABLE "produtos" DROP COLUMN "externalId";

-- AlterTable
ALTER TABLE "revendas" DROP COLUMN "externalId";
