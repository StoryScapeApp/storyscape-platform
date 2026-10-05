-- AlterTable
ALTER TABLE "SessionResult" ADD COLUMN     "globalScore" INTEGER;

ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_globalScore_range"
CHECK ("globalScore" BETWEEN 0 AND 100);
