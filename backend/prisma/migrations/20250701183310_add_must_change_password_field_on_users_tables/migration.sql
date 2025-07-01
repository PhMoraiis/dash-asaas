-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "revendas" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
