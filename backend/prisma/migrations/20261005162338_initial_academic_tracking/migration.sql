-- CreateTable
CREATE TABLE "Professor" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Professor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadingSession" (
    "id" UUID NOT NULL,
    "professorId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "bookRefId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityResponse" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "activityRefId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityResponse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ActivityResponse_attemptNumber_positive" CHECK ("attemptNumber" >= 1)
);

-- CreateTable
CREATE TABLE "HintUsage" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "hintRefId" TEXT NOT NULL,
    "activityRefId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HintUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionResult" (
    "sessionId" UUID NOT NULL,
    "literalScore" INTEGER NOT NULL,
    "inferentialScore" INTEGER NOT NULL,
    "globalLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionResult_pkey" PRIMARY KEY ("sessionId"),
    CONSTRAINT "SessionResult_literalScore_range" CHECK ("literalScore" BETWEEN 0 AND 100),
    CONSTRAINT "SessionResult_inferentialScore_range" CHECK ("inferentialScore" BETWEEN 0 AND 100)
);

-- CreateIndex
CREATE UNIQUE INDEX "Professor_email_key" ON "Professor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Student_code_key" ON "Student"("code");

-- CreateIndex
CREATE INDEX "ReadingSession_professorId_startedAt_idx" ON "ReadingSession"("professorId", "startedAt");

-- CreateIndex
CREATE INDEX "ReadingSession_studentId_startedAt_idx" ON "ReadingSession"("studentId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityResponse_sessionId_activityRefId_attemptNumber_key" ON "ActivityResponse"("sessionId", "activityRefId", "attemptNumber");

-- CreateIndex
CREATE INDEX "HintUsage_sessionId_usedAt_idx" ON "HintUsage"("sessionId", "usedAt");

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "Professor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingSession" ADD CONSTRAINT "ReadingSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityResponse" ADD CONSTRAINT "ActivityResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReadingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HintUsage" ADD CONSTRAINT "HintUsage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReadingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionResult" ADD CONSTRAINT "SessionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ReadingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
