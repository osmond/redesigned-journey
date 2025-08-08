-- CreateEnum
CREATE TYPE "CareType" AS ENUM ('WATER', 'FERTILIZE', 'PRUNE', 'REPOT', 'NOTE');

-- CreateEnum
CREATE TYPE "LightLevel" AS ENUM ('LOW', 'MEDIUM', 'BRIGHT_INDIRECT', 'FULL_SUN');

-- CreateEnum
CREATE TYPE "PotMaterial" AS ENUM ('CLAY', 'PLASTIC', 'CERAMIC');

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT,
    "commonName" TEXT,
    "speciesWfoId" TEXT,
    "roomId" TEXT,
    "lightLevel" "LightLevel",
    "potDiameterCm" DOUBLE PRECISION,
    "potHeightCm" DOUBLE PRECISION,
    "potMaterial" "PotMaterial",
    "recommendedWaterMl" INTEGER,
    "wateringIntervalDays" INTEGER NOT NULL DEFAULT 7,
    "fertilizingIntervalDays" INTEGER NOT NULL DEFAULT 30,
    "lastWateredAt" TIMESTAMP(3),
    "lastFertilizedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "coverPhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT NOT NULL,
    "contentType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantId" TEXT NOT NULL,
    "type" "CareType" NOT NULL,
    "amountMl" INTEGER,
    "note" TEXT,
    "tempC" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "precipMm" DOUBLE PRECISION,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userName" TEXT,

    CONSTRAINT "CareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "plantId" TEXT,
    "roomId" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Species" (
    "id" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "commonName" TEXT,
    "family" TEXT,
    "wfoId" TEXT,
    "gbifKey" INTEGER,
    "rank" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_userId_idx" ON "Room"("userId");

-- CreateIndex
CREATE INDEX "Plant_userId_idx" ON "Plant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Photo_objectKey_key" ON "Photo"("objectKey");

-- CreateIndex
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

-- CreateIndex
CREATE INDEX "CareEvent_userId_idx" ON "CareEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Species_scientificName_key" ON "Species"("scientificName");

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareEvent" ADD CONSTRAINT "CareEvent_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
