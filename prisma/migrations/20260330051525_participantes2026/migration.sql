-- CreateTable
CREATE TABLE "Participantes2026" (
    "id" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "nomeCracha" TEXT,
    "cpf" TEXT,
    "nomeSocial" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "nomeCompletoResponsavel" TEXT,
    "documentoResponsavel" TEXT,
    "telefoneResponsavel" TEXT,
    "linkPagamento" TEXT,
    "idade" INTEGER,
    "valor" DOUBLE PRECISION,
    "statusPagamento" TEXT,
    "tipoParticipacao" "TipoParticipacao" NOT NULL,
    "comissao" TEXT,
    "tamanhoCamisa" TEXT,
    "cep" TEXT NOT NULL,
    "estado" TEXT,
    "cidade" TEXT,
    "bairro" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "outroGenero" TEXT,
    "medicacao" TEXT,
    "alergia" TEXT,
    "outrasInformacoes" TEXT,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "IE" TEXT NOT NULL,
    "instituicaoId" INTEGER,
    "vegetariano" TEXT NOT NULL DEFAULT 'N/A',
    "camisa" BOOLEAN,
    "primeiraComejaca" BOOLEAN DEFAULT false,
    "deficienciaAuditiva" BOOLEAN,
    "deficienciaAutismo" BOOLEAN,
    "deficienciaIntelectual" BOOLEAN,
    "deficienciaParalisiaCerebral" BOOLEAN,
    "deficienciaVisual" BOOLEAN,
    "deficienciaFisica" BOOLEAN,
    "deficienciaOutra" BOOLEAN,
    "deficienciaOutraDescricao" TEXT,
    "otherInstitution" TEXT,

    CONSTRAINT "Participantes2026_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Participantes2026" ADD CONSTRAINT "Participantes2026_instituicaoId_fkey" FOREIGN KEY ("instituicaoId") REFERENCES "InstituicaoEspirita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participantes2026" ADD CONSTRAINT "Participantes2026_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
