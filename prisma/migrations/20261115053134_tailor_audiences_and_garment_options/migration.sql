/*
  Warnings:

  - You are about to drop the column `color` on the `OrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "color",
ADD COLUMN     "garmentColor" TEXT;

-- AlterTable
ALTER TABLE "Tailor" ADD COLUMN     "audiences" "StyleAudience"[] DEFAULT ARRAY[]::"StyleAudience"[];
