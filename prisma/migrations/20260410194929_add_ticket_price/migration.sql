-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "venueName" TEXT,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "galleryUrls" JSONB,
    "tagline" TEXT,
    "heroSubtitle" TEXT,
    "presenterLine" TEXT,
    "organizerLogoUrl" TEXT,
    "ticketPrice" REAL NOT NULL DEFAULT 0,
    "ticketCurrency" TEXT NOT NULL DEFAULT 'USD',
    "salesEndsAt" DATETIME,
    "capacity" INTEGER,
    "ticketNote" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizerId" TEXT,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("capacity", "category", "city", "createdAt", "description", "endsAt", "galleryUrls", "heroSubtitle", "id", "imageUrl", "organizerId", "organizerLogoUrl", "presenterLine", "published", "region", "salesEndsAt", "slug", "startsAt", "tagline", "ticketNote", "title", "venueName") SELECT "capacity", "category", "city", "createdAt", "description", "endsAt", "galleryUrls", "heroSubtitle", "id", "imageUrl", "organizerId", "organizerLogoUrl", "presenterLine", "published", "region", "salesEndsAt", "slug", "startsAt", "tagline", "ticketNote", "title", "venueName" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
