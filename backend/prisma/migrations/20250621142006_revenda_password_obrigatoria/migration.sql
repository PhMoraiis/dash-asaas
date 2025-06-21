/*
  Warnings:

  - Made the column `password` on table `revendas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "revendas" ALTER COLUMN "password" SET NOT NULL;
