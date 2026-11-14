/*
  Warnings:

  - A unique constraint covering the columns `[cognitoSub]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MeasurementMethod" AS ENUM ('MANUAL', 'CAMERA_ASSISTED');

-- CreateEnum
CREATE TYPE "StyleAudience" AS ENUM ('WOMEN', 'MEN', 'TEENAGERS', 'CHILDREN');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "audience" "StyleAudience",
ADD COLUMN     "fabric" TEXT,
ADD COLUMN     "measurementMethod" "MeasurementMethod" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "measurementUnit" TEXT NOT NULL DEFAULT 'cm',
ADD COLUMN     "sizeLabel" TEXT,
ADD COLUMN     "styleName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cognitoSub" TEXT,
ADD COLUMN     "profileImageKey" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_cognitoSub_key" ON "User"("cognitoSub");
