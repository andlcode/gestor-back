/**
 * Política para **nova** senha (cadastro, redefinição, alteração no perfil/admin).
 * Não se aplica ao login — apenas bcrypt.compare com o hash existente.
 *
 * Manter alinhado com `frontend/src/utils/newPasswordPolicy.js`.
 */
const NEW_PASSWORD_POLICY_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres e pelo menos 1 letra maiúscula.';

function meetsNewPasswordPolicy(password) {
  const s = String(password ?? '');
  return s.length >= 8 && /[A-Z]/.test(s);
}

module.exports = {
  NEW_PASSWORD_POLICY_MESSAGE,
  meetsNewPasswordPolicy,
};
