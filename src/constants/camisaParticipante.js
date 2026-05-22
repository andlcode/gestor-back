/** Valores persistidos em `camisaTipo` / `camisaCor` (API + Prisma). */
const CAMISA_TIPO_VALUES = ['algodao', 'poliester'];
const CAMISA_COR_VALUES = ['preto', 'branco'];

const CAMISA_TAMANHO_INFANTIL = 'Infantil';
const CAMISA_IDADE_INFANTIL_MIN = 1;
const CAMISA_IDADE_INFANTIL_MAX = 14;

const isTamanhoCamisaInfantil = (tamanho) =>
  String(tamanho || '').trim() === CAMISA_TAMANHO_INFANTIL;

const isIdadeInfantilPersistidaEmTamanho = (tamanho) =>
  /^([1-9]|1[0-4])$/.test(String(tamanho || '').trim());

const parseIdadeCamisaInfantil = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return NaN;
  return Number(raw);
};

const idadeInfantilValida = (idade) =>
  Number.isInteger(idade) &&
  idade >= CAMISA_IDADE_INFANTIL_MIN &&
  idade <= CAMISA_IDADE_INFANTIL_MAX;

/**
 * Camisa infantil: grava idade (1–14) em `tamanhoCamisa` no lugar de "Infantil".
 * @returns {string|null} mensagem de erro amigável
 */
const validateAndNormalizeIdadeCamisaInfantil = (dados, options = {}) => {
  if (!dados || typeof dados !== 'object') return null;
  const { permitirInfantilSemIdade = false } = options;
  const querCamisa = dados.camisa === true;
  if (!querCamisa) {
    dados.idadeCamisaInfantil = null;
    return null;
  }
  let tam = String(dados.tamanhoCamisa || '').trim();

  if (isTamanhoCamisaInfantil(tam)) {
    const idade = parseIdadeCamisaInfantil(dados.idadeCamisaInfantil);
    if (!idadeInfantilValida(idade)) {
      if (permitirInfantilSemIdade) {
        dados.tamanhoCamisa = CAMISA_TAMANHO_INFANTIL;
        dados.idadeCamisaInfantil = null;
        return null;
      }
      return 'Informe a idade da criança (entre 1 e 14 anos) para a camisa infantil.';
    }
    dados.tamanhoCamisa = String(idade);
    dados.idadeCamisaInfantil = null;
    return null;
  }

  if (isIdadeInfantilPersistidaEmTamanho(tam)) {
    const idade = Number(tam);
    if (!idadeInfantilValida(idade)) {
      return 'Informe a idade da criança (entre 1 e 14 anos) para a camisa infantil.';
    }
    dados.tamanhoCamisa = String(idade);
    dados.idadeCamisaInfantil = null;
    return null;
  }

  dados.idadeCamisaInfantil = null;
  return null;
};

/** Produção: coluna `idadeCamisaInfantil` só após migration confirmada. */
const stripIdadeCamisaInfantilSeAusenteNoBanco = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  delete obj.idadeCamisaInfantil;
};

function isCamisaTipoValid(v) {
  return CAMISA_TIPO_VALUES.includes(String(v || '').trim());
}

function isCamisaCorValid(v) {
  return CAMISA_COR_VALUES.includes(String(v || '').trim());
}

module.exports = {
  CAMISA_TIPO_VALUES,
  CAMISA_COR_VALUES,
  CAMISA_TAMANHO_INFANTIL,
  isCamisaTipoValid,
  isCamisaCorValid,
  validateAndNormalizeIdadeCamisaInfantil,
  stripIdadeCamisaInfantilSeAusenteNoBanco,
};
