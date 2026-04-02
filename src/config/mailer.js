const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Verificando se a porta e o secure estão configurados corretamente
const port = Number(process.env.MAIL_PORT);
const secure = port === 465; // Usar SSL/TLS com porta 465, caso contrário, STARTTLS com 587
const hasRequiredConfig = Boolean(
  process.env.MAIL_HOST &&
    process.env.MAIL_PORT &&
    process.env.MAIL_USER &&
    process.env.MAIL_PASS
);

// Criação do transportador para o Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST, // smtp.gmail.com
  port: port,                  // Porta definida nas variáveis de ambiente (587 ou 465)
  secure: secure,              // Configuração de segurança
  auth: {
    user: process.env.MAIL_USER, // E-mail de envio
    pass: process.env.MAIL_PASS, // Senha ou App Password (para Gmail)
  },
});

// Testando a conexão
transporter.verify((error, success) => {
  if (error) {
    console.log("Erro ao conectar no SMTP:", error);
  } else {
    console.log("Conexão SMTP bem-sucedida!", {
      host: process.env.MAIL_HOST,
      port,
      secure,
      userConfigured: Boolean(process.env.MAIL_USER),
      passConfigured: Boolean(process.env.MAIL_PASS),
      hasRequiredConfig,
    });
  }
});

module.exports = transporter;
