-- Inscrições: flag ativo/inativo (default true para registros existentes)
ALTER TABLE "Participantes2025" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Participantes2026" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
