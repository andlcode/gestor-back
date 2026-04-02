const { transporter, hasRequiredConfig } = require('../config/mailer');

const REQUIRED_MAIL_ENV_KEYS = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];
const LOGO_URL = 'https://i.postimg.cc/CxwC6HnL/favicon.png';
const PORTAL_URL = (process.env.FRONTEND_URL || process.env.BASE_URL || 'https://www.comejaca.org.br').replace(
  /\/+$/,
  ''
);

function getMissingMailEnv() {
  return REQUIRED_MAIL_ENV_KEYS.filter((key) => !process.env[key]);
}

function buildDefaultHeaders() {
  return {
    'X-Mailer': 'Nodemailer',
    'X-Priority': '3',
    'Return-Path': process.env.MAIL_USER,
  };
}

function ensureEmailSendingIsAvailable() {
  if (process.env.ENABLE_SMTP === 'false') {
    throw new Error('SMTP desativado por configuração (ENABLE_SMTP=false).');
  }

  const missingMailEnv = getMissingMailEnv();
  if (!hasRequiredConfig || missingMailEnv.length > 0) {
    throw new Error(`Configuração SMTP incompleta. Variáveis ausentes: ${missingMailEnv.join(', ')}`);
  }
}

async function sendEmail({ to, subject, html, attachments, headers }) {
  ensureEmailSendingIsAvailable();

  const recipients = Array.isArray(to) ? to : [to];

  try {
    const info = await transporter.sendMail({
      from: `"COMEJACA" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
      headers: {
        ...buildDefaultHeaders(),
        ...headers,
      },
    });

    if (!Array.isArray(info?.accepted) || info.accepted.length === 0) {
      throw new Error(
        `O provedor SMTP não confirmou destinatários aceitos. Rejeitados: ${JSON.stringify(
          info?.rejected || []
        )}`
      );
    }

    console.log('Email enviado com sucesso:', {
      subject,
      to: recipients,
      messageId: info?.messageId,
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
    });

    return info;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', {
      subject,
      to: recipients,
      error: error?.message || error,
    });
    throw error;
  }
}

function getBaseTemplate({ title, contentHtml, background = '#F2F2F2', footerTeam = 'Equipe COMEJACA' }) {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 30px 0;
          background-color: ${background};
        }
        .container {
          max-width: 680px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          padding: 40px 30px 20px;
          border-bottom: 1px solid #e9ecef;
          text-align: center;
        }
        .header img {
          height: 40px;
        }
        .content {
          padding: 40px 30px;
          color: #4a4e69;
        }
        .code-container {
          margin: 30px 0;
          text-align: center;
        }
        .verification-code {
          display: inline-block;
          padding: 15px 30px;
          background-color: #22223b;
          border-radius: 6px;
          font-size: 24px;
          font-weight: 600;
          color: #fff;
          letter-spacing: 2px;
        }
        .button-container {
          margin: 30px 0;
          text-align: center;
        }
        .reset-button {
          display: inline-block;
          padding: 15px 30px;
          background-color: #22223b;
          border-radius: 6px;
          font-size: 16px;
          font-weight: bold;
          color: #fff !important;
          text-decoration: none !important;
        }
        a {
          color: #2b6cb0 !important;
          text-decoration: none !important;
        }
        .footer {
          padding: 25px 30px;
          background-color: #f8f9fa;
          text-align: center;
          font-size: 14px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="Logo COMEJACA">
        </div>
        <div class="content">
          ${contentHtml}
        </div>
        <div class="footer">
          <p>Esta é uma mensagem automática. Por favor não responda este e-mail.</p>
          <p>Dúvidas? Contate-nos: suporte@comejaca.org.br </p>
          <p>${footerTeam}</p>
          <p>© ${new Date().getFullYear()} COMEJACA Gestão. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendVerificationEmail({ to, name, code, type = 'register' }) {
  const isResend = type === 'resend';
  const subject = isResend ? 'Novo código' : 'Confirmação de Cadastro';
  const intro = isResend
    ? `Prezado(a) ${name},`
    : `Olá ${name},`;
  const bodyText = isResend
    ? `Seu cadastro no Sistema de <strong>Portal COMEJACA</strong> está quase completo. <br><br> O próximo passo é verificar seu endereço e-mail inserindo o código abaixo através do portal <a href="${PORTAL_URL}" target="_blank">COMEJACA</a>.`
    : `O seu cadastro no Sistema de <strong>Portal COMEJACA</strong> está quase completo. <br><br>Para acessar sem restrições você precisa verificar o seu e-mail. <br><br> Insira o código abaixo em <a href="${PORTAL_URL}" target="_blank">COMEJACA</a>.`;

  return sendEmail({
    to,
    subject,
    html: getBaseTemplate({
      title: isResend ? 'Novo código' : 'Confirmar Cadastro',
      background: isResend ? '#22223b' : '#F2F2F2',
      footerTeam: isResend ? 'Equipe de Tecnologia COMEJACA' : 'Equipe COMEJACA',
      contentHtml: `
        <p>${intro}</p>
        <p>${bodyText}</p>
        <div class="code-container">
          <div class="verification-code">${code}</div>
        </div>
        <p>⏳ Este código é válido por 15 minutos.</p>
        <p>Atenciosamente,<br>${isResend ? 'Equipe de Tecnologia COMEJACA' : 'Equipe COMEJACA'}</p>
      `,
    }),
  });
}

async function sendAccountVerifiedEmail({ to, name }) {
  return sendEmail({
    to,
    subject: '✅ Conta Verificada',
    html: getBaseTemplate({
      title: 'Conta Verificada',
      contentHtml: `
        <p>Olá ${name},</p>
        <p>Informamos que seu acesso ao <strong>Portal COMEJACA</strong> foi verificado com sucesso!</p>
        <p>Agora você tem acesso completo ao sistema.</p>
        <p>Estamos empenhados em fazer você ter a melhor experiência.</p>
        <p>Atenciosamente,<br>Equipe COMEJACA</p>
      `,
    }),
  });
}

async function sendResetPasswordEmail({ to, name, resetLink, expiresInMinutes = 15 }) {
  return sendEmail({
    to,
    subject: 'Redefinição de Senha',
    html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Redefinição de senha</title>
      </head>
      <body style="margin:0;padding:24px 0;background:#f8fafc;font-family:Arial,sans-serif;color:#334155;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;box-shadow:0 18px 40px rgba(17,24,39,0.08);">
          <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
            <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">
              <span style="color:#64748b;">46º</span>
              <span style="margin-left:6px;letter-spacing:0.06em;">COMEJACA</span>
              <span style="margin-left:6px;color:#94a3b8;font-weight:600;">2025</span>
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Sistema de inscrições</p>
          </div>
          <div style="padding:32px 28px;">
            <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;color:#111827;">Redefinir senha</h1>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">Olá, ${name || 'participante'}.</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
              Recebemos uma solicitação para redefinir a sua senha. Este link é temporário e expira em ${expiresInMinutes} minutos.
            </p>
            <div style="margin:0 0 24px;">
              <a
                href="${resetLink}"
                target="_blank"
                rel="noopener noreferrer"
                style="display:inline-block;padding:14px 24px;background:#1f2133;color:#ffffff;text-decoration:none;border-radius:5px;font-size:15px;font-weight:600;box-shadow:0 8px 18px rgba(17,24,39,0.12);"
              >
                Criar nova senha
              </a>
            </div>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">
              Se você não solicitou esta redefinição, ignore este e-mail.
            </p>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
              Caso o botão não funcione, copie e cole este link no navegador:<br />
              <span style="color:#2563eb;word-break:break-all;">${resetLink}</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

async function sendAttachmentEmail({ to, name, file, cc = [] }) {
  const recipients = [...(Array.isArray(to) ? to : [to]), ...cc].filter(Boolean);

  return sendEmail({
    to: recipients,
    subject: `Pagamento de ${name} confirmado`,
    attachments: file
      ? [
          {
            filename: file.originalname,
            path: file.path,
          },
        ]
      : undefined,
    html: getBaseTemplate({
      title: 'Pagamento confirmado',
      background: '#22223b',
      contentHtml: `
        <p>Prezado(a) ${name},</p>
        <p>Recebemos e confirmamos o seu pagamento.</p>
        <p>Verifique no anexo o comprovante correspondente.</p>
        <p>Obrigado por sua participação!<br />Equipe COMEJACA</p>
      `,
    }),
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendAccountVerifiedEmail,
  sendResetPasswordEmail,
  sendAttachmentEmail,
};
