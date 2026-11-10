-- AlterTable
ALTER TABLE "Tailor" ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "specialization" TEXT,
ALTER COLUMN "categories" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "startingPrice" SET DEFAULT 0;
