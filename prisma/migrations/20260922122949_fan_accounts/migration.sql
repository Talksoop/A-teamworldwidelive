-- AlterTable
ALTER TABLE "AmaRequest" ADD COLUMN "fanId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "fanId" TEXT;

-- CreateTable
CREATE TABLE "Fan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fanId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Fan_email_key" ON "Fan"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_fanId_hostId_key" ON "Follow"("fanId", "hostId");
