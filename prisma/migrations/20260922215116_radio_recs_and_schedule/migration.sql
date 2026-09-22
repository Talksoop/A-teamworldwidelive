-- CreateTable
CREATE TABLE "LiveEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Going live',
    "platform" TEXT,
    "startsAt" DATETIME NOT NULL,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RadioRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fanId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "songName" TEXT,
    "link" TEXT,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "RadioRecommendation_submissionId_key" ON "RadioRecommendation"("submissionId");
