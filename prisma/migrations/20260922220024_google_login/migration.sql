-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Fan" ("createdAt", "email", "id", "name", "passwordHash") SELECT "createdAt", "email", "id", "name", "passwordHash" FROM "Fan";
DROP TABLE "Fan";
ALTER TABLE "new_Fan" RENAME TO "Fan";
CREATE UNIQUE INDEX "Fan_email_key" ON "Fan"("email");
CREATE UNIQUE INDEX "Fan_googleId_key" ON "Fan"("googleId");
CREATE TABLE "new_Host" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "platformFeeBps" INTEGER NOT NULL DEFAULT 2000,
    "stripeAccountId" TEXT,
    "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isFounder" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Host" ("createdAt", "email", "id", "isFounder", "name", "passwordHash", "platformFeeBps", "slug", "stripeAccountId", "stripeOnboarded") SELECT "createdAt", "email", "id", "isFounder", "name", "passwordHash", "platformFeeBps", "slug", "stripeAccountId", "stripeOnboarded" FROM "Host";
DROP TABLE "Host";
ALTER TABLE "new_Host" RENAME TO "Host";
CREATE UNIQUE INDEX "Host_email_key" ON "Host"("email");
CREATE UNIQUE INDEX "Host_googleId_key" ON "Host"("googleId");
CREATE UNIQUE INDEX "Host_slug_key" ON "Host"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
