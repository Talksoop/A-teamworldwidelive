-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "songName" TEXT,
    "message" TEXT,
    "link" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'LINK',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "skipOfferId" TEXT,
    "reactOfferId" TEXT,
    "parentSubmissionId" TEXT,
    "stripeSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Submission" ("amountCents", "createdAt", "id", "link", "message", "name", "order", "paid", "parentSubmissionId", "reactOfferId", "skipOfferId", "songName", "status", "stripeSessionId") SELECT "amountCents", "createdAt", "id", "link", "message", "name", "order", "paid", "parentSubmissionId", "reactOfferId", "skipOfferId", "songName", "status", "stripeSessionId" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE UNIQUE INDEX "Submission_stripeSessionId_key" ON "Submission"("stripeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
