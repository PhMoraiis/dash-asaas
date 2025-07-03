/*
  Warnings:

  - A unique constraint covering the columns `[webhookToken]` on the table `produtos` will be added. If there are existing duplicate values, this will fail.
  - The required column `webhookToken` was added to the `produtos` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "produtos" ADD COLUMN     "webhookToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "produtos_webhookToken_key" ON "produtos"("webhookToken");
