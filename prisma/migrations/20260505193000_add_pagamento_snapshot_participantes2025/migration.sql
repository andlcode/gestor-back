-- Snapshot financeiro ao gerar link Mercado Pago (colunas nullable; linhas existentes permanecem NULL até novo "Pagar")
ALTER TABLE "Participantes2025" ADD COLUMN "valorInscricaoPagamento" DOUBLE PRECISION,
ADD COLUMN "valorCamisaPagamento" DOUBLE PRECISION,
ADD COLUMN "tipoCamisaPagamento" TEXT,
ADD COLUMN "corCamisaPagamento" TEXT,
ADD COLUMN "valorTotalPagamento" DOUBLE PRECISION,
ADD COLUMN "descricaoPagamento" TEXT,
ADD COLUMN "mercadoPagoPreferenceId" TEXT,
ADD COLUMN "mercadoPagoPaymentId" TEXT;
