-- CreateTable
CREATE TABLE "AmaRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "link" TEXT,
    "accessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "stripeSessionId" TEXT,
    "responseText" TEXT,
    "responseLink" TEXT,
    "responseSourceType" TEXT,
    "answeredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "submissionMode" TEXT NOT NULL DEFAULT 'FREE',
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "amaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "amaPriceCents" INTEGER NOT NULL DEFAULT 1000
);
INSERT INTO "new_Settings" ("basePriceCents", "id", "submissionMode") SELECT "basePriceCents", "id", "submissionMode" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AmaRequest_accessToken_key" ON "AmaRequest"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "AmaRequest_stripeSessionId_key" ON "AmaRequest"("stripeSessionId");
