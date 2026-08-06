-- AlterTable
ALTER TABLE "Generation" ADD COLUMN     "footerHtml" TEXT,
ADD COLUMN     "headerHtml" TEXT;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "footerContent" TEXT,
ADD COLUMN     "headerContent" TEXT;
