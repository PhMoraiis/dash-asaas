/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `revendas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `revendas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "revendas" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "admins_slug_key" ON "admins"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "revendas_slug_key" ON "revendas"("slug");
