-- CreateEnum
CREATE TYPE "ImageState" AS ENUM ('NONE', 'PENDING', 'GENERATING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "imageState" "ImageState" NOT NULL DEFAULT 'NONE';
