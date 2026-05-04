/*
  Warnings:

  - You are about to drop the column `ativo` on the `Participantes2025` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Participantes2025" DROP COLUMN "ativo",
ADD COLUMN     "statusAutorizacao" TEXT DEFAULT 'pendente';

-- AlterTable
ALTER TABLE "Participantes2026" ADD COLUMN     "camisaCor" TEXT,
ADD COLUMN     "camisaTipo" TEXT;
