/**
 * Idade em anos completos na data de referência (calendário local).
 * @param {Date|string} dataNascimento
 * @param {Date|string} dataReferencia
 * @returns {number|null}
 */
const calcularIdadeNaData = (dataNascimento, dataReferencia) => {
  const nascimento =
    dataNascimento instanceof Date ? dataNascimento : new Date(dataNascimento);
  const ref =
    dataReferencia instanceof Date ? dataReferencia : new Date(dataReferencia);
  if (Number.isNaN(nascimento.getTime()) || Number.isNaN(ref.getTime())) {
    return null;
  }
  let idade = ref.getFullYear() - nascimento.getFullYear();
  if (
    ref.getMonth() < nascimento.getMonth() ||
    (ref.getMonth() === nascimento.getMonth() && ref.getDate() < nascimento.getDate())
  ) {
    idade -= 1;
  }
  return idade;
};

const safeFloat = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Evento ativo usado para precificação (mesmo critério de `evento.controller` getEvento).
 */
const loadEventoAtivoParaValor = async (prismaClient) =>
  prismaClient.evento.findFirst({
    where: { ativo: true },
    orderBy: { updatedAt: 'desc' },
  });

/**
 * Valor da inscrição conforme tabela Evento e dados da inscrição.
 * Ordem: (1) até 10 anos na data de início do evento → valorPequenoCompanheiro (Plano Geral 2026: 3 a 10 anos);
 * (2) Trabalhador → valorTrabalhador; (3) demais (ex. Confraternista) → valorConfraternista.
 *
 * @param {{ dataNascimento: Date|string, tipoParticipacao?: string|null }} inscricao
 * @param {{ dataInicio: Date|null|undefined, valorTrabalhador?: number|null, valorConfraternista?: number|null, valorPequenoCompanheiro?: number|null }|null|undefined} evento
 * @returns {{ valor: number, regra: string, idadeNaDataEvento: number|null }}
 */
const getValorInscricao = ({ inscricao, evento }) => {
  if (!evento || !evento.dataInicio) {
    return { valor: 0, regra: 'sem_evento', idadeNaDataEvento: null };
  }

  const idadeNaDataEvento = calcularIdadeNaData(
    inscricao.dataNascimento,
    evento.dataInicio
  );

  if (idadeNaDataEvento !== null && idadeNaDataEvento <= 10) {
    return {
      valor: safeFloat(evento.valorPequenoCompanheiro),
      regra: 'pequeno_companheiro',
      idadeNaDataEvento,
    };
  }

  const tipo = String(inscricao.tipoParticipacao || '').trim();
  if (tipo === 'Trabalhador') {
    return {
      valor: safeFloat(evento.valorTrabalhador),
      regra: 'trabalhador',
      idadeNaDataEvento,
    };
  }

  return {
    valor: safeFloat(evento.valorConfraternista),
    regra: 'confraternista',
    idadeNaDataEvento,
  };
};

module.exports = {
  calcularIdadeNaData,
  getValorInscricao,
  loadEventoAtivoParaValor,
};
