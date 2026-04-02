const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const port = Number(process.env.MAIL_PORT);
const secure = port === 465;
const hasRequiredConfig = Boolean(
  process.env.MAIL_HOST &&
    port &&
    process.env.MAIL_USER &&
    process.env.MAIL_PASS
);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port,
  secure,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

async function verifyMailerConnection() {
  if (!hasRequiredConfig || process.env.ENABLE_SMTP === 'false') {
    console.log('Verificação SMTP ignorada.', {
      enabled: process.env.ENABLE_SMTP !== 'false',
      hasRequiredConfig,
    });
    return false;
  }

  try {
    await transporter.verify();
    console.log('Conexão SMTP bem-sucedida!', {
      host: process.env.MAIL_HOST,
      port,
      secure,
      userConfigured: Boolean(process.env.MAIL_USER),
      passConfigured: Boolean(process.env.MAIL_PASS),
      hasRequiredConfig,
    });
    return true;
  } catch (error) {
    console.error('Erro ao conectar no SMTP:', error);
    return false;
  }
}

module.exports = {
  transporter,
  verifyMailerConnection,
  hasRequiredConfig,
};
