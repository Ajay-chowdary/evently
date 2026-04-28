-- AlterTable
ALTER TABLE "Event" ADD COLUMN "capacity" INTEGER;
ALTER TABLE "Event" ADD COLUMN "galleryUrls" JSONB;
ALTER TABLE "Event" ADD COLUMN "heroSubtitle" TEXT;
ALTER TABLE "Event" ADD COLUMN "organizerLogoUrl" TEXT;
ALTER TABLE "Event" ADD COLUMN "presenterLine" TEXT;
ALTER TABLE "Event" ADD COLUMN "region" TEXT;
ALTER TABLE "Event" ADD COLUMN "salesEndsAt" DATETIME;
ALTER TABLE "Event" ADD COLUMN "tagline" TEXT;
ALTER TABLE "Event" ADD COLUMN "ticketNote" TEXT;
ALTER TABLE "Event" ADD COLUMN "venueName" TEXT;

-- CreateTable
CREATE TABLE "OrganizerFollow" (
    "followerId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("followerId", "organizerId"),
    CONSTRAINT "OrganizerFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizerFollow_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
