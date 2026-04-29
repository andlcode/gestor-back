/** Valores persistidos em `camisaTipo` / `camisaCor` (API + Prisma). */
const CAMISA_TIPO_VALUES = ['algodao', 'poliester'];
const CAMISA_COR_VALUES = ['preto', 'branco'];

function isCamisaTipoValid(v) {
  return CAMISA_TIPO_VALUES.includes(String(v || '').trim());
}

function isCamisaCorValid(v) {
  return CAMISA_COR_VALUES.includes(String(v || '').trim());
}

module.exports = {
  CAMISA_TIPO_VALUES,
  CAMISA_COR_VALUES,
  isCamisaTipoValid,
  isCamisaCorValid,
};
