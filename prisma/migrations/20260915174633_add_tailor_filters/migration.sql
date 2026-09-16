-- DropIndex
DROP INDEX "Tailor_location_idx";

-- AlterTable
ALTER TABLE "Tailor" ADD COLUMN     "acceptingOrders" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "startingPrice" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Tailor_acceptingOrders_idx" ON "Tailor"("acceptingOrders");

-- CreateIndex
CREATE INDEX "Tailor_startingPrice_idx" ON "Tailor"("startingPrice");
