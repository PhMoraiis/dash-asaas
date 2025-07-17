/*
  Warnings:

  - You are about to drop the column `errorMessage` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `event` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `signature` on the `webhooks` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `webhooks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "webhooks_externalId_idx";

-- AlterTable
ALTER TABLE "webhooks" DROP COLUMN "errorMessage",
DROP COLUMN "event",
DROP COLUMN "externalId",
DROP COLUMN "processedAt",
DROP COLUMN "signature",
DROP COLUMN "status";
