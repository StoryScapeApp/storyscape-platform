-- AlterTable
ALTER TABLE "ActivityResponse" ADD COLUMN     "chapterRefId" TEXT,
ADD COLUMN     "chosenLetter" TEXT,
ADD COLUMN     "correctLetter" TEXT,
ADD COLUMN     "options" JSONB,
ADD COLUMN     "questionNumber" INTEGER,
ADD COLUMN     "questionText" TEXT,
ADD COLUMN     "questionType" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "name" TEXT;
