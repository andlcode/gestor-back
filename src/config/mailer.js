const { Resend } = require('resend');
const dotenv = require('dotenv');

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromEmail =
  process.env.RESEND_FROM_EMAIL ||
  process.env.MAIL_FROM ||
  'COMEJACA <onboarding@resend.dev>';
const hasRequiredConfig = Boolean(resendApiKey);
const resend = hasRequiredConfig ? new Resend(resendApiKey) : null;

async function verifyMailerConnection() {
  if (!hasRequiredConfig) {
    console.warn('Verificação de e-mail ignorada: RESEND_API_KEY não configurada.', {
      hasRequiredConfig,
      hasFromEmail: Boolean(defaultFromEmail),
    });
    return false;
  }

  try {
    console.log('Provedor de e-mail configurado com sucesso.', {
      provider: 'resend',
      hasRequiredConfig,
      hasFromEmail: Boolean(defaultFromEmail),
    });
    return true;
  } catch (error) {
    console.error('Erro ao validar configuração de e-mail:', error);
    return false;
  }
}

module.exports = {
  resend,
  verifyMailerConnection,
  hasRequiredConfig,
  defaultFromEmail,
};
