/*
  Warnings:

  - A unique constraint covering the columns `[asaasEventId]` on the table `webhooks` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "webhooks" ADD COLUMN     "asaasEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_asaasEventId_key" ON "webhooks"("asaasEventId");
