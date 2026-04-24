-- AlterTable
ALTER TABLE "Evento" ADD COLUMN "camisaImagens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
