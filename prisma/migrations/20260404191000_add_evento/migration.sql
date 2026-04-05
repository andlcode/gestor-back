-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeExibicao" TEXT,
    "nomeCompleto" TEXT,
    "ano" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "localNome" TEXT NOT NULL,
    "localEndereco" TEXT,
    "valorTrabalhador" DOUBLE PRECISION,
    "valorConfraternista" DOUBLE PRECISION,
    "valorPequenoCompanheiro" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);
