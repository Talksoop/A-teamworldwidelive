-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AmaRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
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
INSERT INTO "new_AmaRequest" ("accessToken", "amountCents", "answeredAt", "createdAt", "hostId", "id", "link", "name", "paid", "question", "responseLink", "responseSourceType", "responseText", "status", "stripeSessionId") SELECT "accessToken", "amountCents", "answeredAt", "createdAt", "hostId", "id", "link", "name", "paid", "question", "responseLink", "responseSourceType", "responseText", "status", "stripeSessionId" FROM "AmaRequest";
DROP TABLE "AmaRequest";
ALTER TABLE "new_AmaRequest" RENAME TO "AmaRequest";
CREATE UNIQUE INDEX "AmaRequest_accessToken_key" ON "AmaRequest"("accessToken");
CREATE UNIQUE INDEX "AmaRequest_stripeSessionId_key" ON "AmaRequest"("stripeSessionId");
CREATE TABLE "new_Battle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "songAId" TEXT NOT NULL,
    "songBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "votesA" INTEGER NOT NULL DEFAULT 0,
    "votesB" INTEGER NOT NULL DEFAULT 0,
    "winnerSide" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Battle" ("createdAt", "hostId", "id", "songAId", "songBId", "status", "votesA", "votesB", "winnerSide") SELECT "createdAt", "hostId", "id", "songAId", "songBId", "status", "votesA", "votesB", "winnerSide" FROM "Battle";
DROP TABLE "Battle";
ALTER TABLE "new_Battle" RENAME TO "Battle";
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "bonusSubmissions" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Offer" ("active", "bonusSubmissions", "createdAt", "description", "hostId", "id", "name", "priceCents", "priority", "type") SELECT "active", "bonusSubmissions", "createdAt", "description", "hostId", "id", "name", "priceCents", "priority", "type" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "submissionMode" TEXT NOT NULL DEFAULT 'FREE',
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "amaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "amaPriceCents" INTEGER NOT NULL DEFAULT 1000
);
INSERT INTO "new_Settings" ("amaEnabled", "amaPriceCents", "basePriceCents", "hostId", "id", "submissionMode") SELECT "amaEnabled", "amaPriceCents", "basePriceCents", "hostId", "id", "submissionMode" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_hostId_key" ON "Settings"("hostId");
CREATE TABLE "new_Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
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
INSERT INTO "new_Submission" ("amountCents", "createdAt", "hostId", "id", "link", "message", "name", "order", "paid", "parentSubmissionId", "reactOfferId", "skipOfferId", "songName", "sourceType", "status", "stripeSessionId") SELECT "amountCents", "createdAt", "hostId", "id", "link", "message", "name", "order", "paid", "parentSubmissionId", "reactOfferId", "skipOfferId", "songName", "sourceType", "status", "stripeSessionId" FROM "Submission";
DROP TABLE "Submission";
ALTER TABLE "new_Submission" RENAME TO "Submission";
CREATE UNIQUE INDEX "Submission_stripeSessionId_key" ON "Submission"("stripeSessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
