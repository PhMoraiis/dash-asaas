/*
  Warnings:

  - You are about to drop the `webhook_logs` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `status` on the `webhooks` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "webhook_logs" DROP CONSTRAINT "webhook_logs_webhookId_fkey";

-- DropIndex
DROP INDEX "webhooks_status_idx";

-- AlterTable
ALTER TABLE "webhooks" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropTable
DROP TABLE "webhook_logs";

-- DropEnum
DROP TYPE "log_level";

-- DropEnum
DROP TYPE "webhook_status";

-- CreateTable
CREATE TABLE "user_charts" (
    "id" TEXT NOT NULL,
    "revendaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_charts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_charts" ADD CONSTRAINT "user_charts_revendaId_fkey" FOREIGN KEY ("revendaId") REFERENCES "revendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
