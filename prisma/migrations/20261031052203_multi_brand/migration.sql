-- Multi-brand: one brand per Facebook Page. Existing data is attached to each user's existing brand,
-- and the page selected on the Meta connection moves onto that brand.

DROP INDEX "Brand_userId_key";
DROP INDEX "Post_userId_status_idx";

ALTER TABLE "Brand" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "igUserId" TEXT,
ADD COLUMN "igUsername" TEXT,
ADD COLUMN "pageAccessToken" TEXT,
ADD COLUMN "pageId" TEXT,
ADD COLUMN "pageName" TEXT;

-- Move the selected page from the Meta connection to the user's brand
UPDATE "Brand" b SET
  "pageId" = m."pageId",
  "pageName" = m."pageName",
  "pageAccessToken" = m."pageAccessToken",
  "igUserId" = m."igUserId",
  "igUsername" = m."igUsername"
FROM "MetaConnection" m
WHERE m."userId" = b."userId";

-- Add brandId as nullable, backfill from the user's brand, then require it
ALTER TABLE "Campaign" ADD COLUMN "brandId" TEXT;
ALTER TABLE "Post" ADD COLUMN "brandId" TEXT;
ALTER TABLE "StrategyReport" ADD COLUMN "brandId" TEXT;

UPDATE "Campaign" c SET "brandId" = b."id" FROM "Brand" b WHERE b."userId" = c."userId";
UPDATE "Post" p SET "brandId" = b."id" FROM "Brand" b WHERE b."userId" = p."userId";
UPDATE "StrategyReport" r SET "brandId" = b."id" FROM "Brand" b WHERE b."userId" = r."userId";

-- Rows of users without a brand can't be attached to anything
DELETE FROM "Post" WHERE "brandId" IS NULL;
DELETE FROM "Campaign" WHERE "brandId" IS NULL;
DELETE FROM "StrategyReport" WHERE "brandId" IS NULL;

ALTER TABLE "Campaign" ALTER COLUMN "brandId" SET NOT NULL;
ALTER TABLE "Post" ALTER COLUMN "brandId" SET NOT NULL;
ALTER TABLE "StrategyReport" ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "MetaConnection" DROP COLUMN "igUserId",
DROP COLUMN "igUsername",
DROP COLUMN "pageAccessToken",
DROP COLUMN "pageId",
DROP COLUMN "pageName";

CREATE UNIQUE INDEX "Brand_userId_pageId_key" ON "Brand"("userId", "pageId");
CREATE INDEX "Post_brandId_status_idx" ON "Post"("brandId", "status");

ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StrategyReport" ADD CONSTRAINT "StrategyReport_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
