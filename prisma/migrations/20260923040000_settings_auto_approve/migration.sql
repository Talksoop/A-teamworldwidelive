-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "submissionMode" TEXT NOT NULL DEFAULT 'FREE',
    "basePriceCents" INTEGER NOT NULL DEFAULT 0,
    "amaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "amaPriceCents" INTEGER NOT NULL DEFAULT 1000,
    "queueOpen" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Settings" ("amaEnabled", "amaPriceCents", "basePriceCents", "hostId", "id", "queueOpen", "submissionMode") SELECT "amaEnabled", "amaPriceCents", "basePriceCents", "hostId", "id", "queueOpen", "submissionMode" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_hostId_key" ON "Settings"("hostId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
