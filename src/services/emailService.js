const fs = require('fs/promises');
const path = require('path');
const { resend, hasRequiredConfig, defaultFromEmail } = require('../config/mailer');

const LOGO_URL = 'https://i.postimg.cc/CxwC6HnL/favicon.png';
const PORTAL_URL = (process.env.FRONTEND_URL || process.env.BASE_URL || 'https://www.comejaca.org.br').replace(
  /\/+$/,
  ''
);

function ensureEmailSendingIsAvailable() {
  if (!hasRequiredConfig || !resend) {
    throw new Error('Configuração de e-mail incompleta. Defina RESEND_API_KEY.');
  }
}

function normalizeRecipients(to) {
  return (Array.isArray(to) ? to : [to]).filter(Boolean);
}

async function buildResendAttachments(attachments = []) {
  const normalizedAttachments = Array.isArray(attachments) ? attachments : [attachments];

  const preparedAttachments = await Promise.all(
    normalizedAttachments.filter(Boolean).map(async (attachment) => {
      if (attachment.content) {
        return attachment;
      }

      if (attachment.path) {
        const fileBuffer = await fs.readFile(attachment.path);
        return {
          filename: attachment.filename || path.basename(attachment.path),
          content: fileBuffer.toString('base64'),
        };
      }

      return null;
    })
  );

  return preparedAttachments.filter(Boolean);
}

async function sendEmail({ to, subject, html, attachments }) {
  ensureEmailSendingIsAvailable();

  const recipients = normalizeRecipients(to);
  const preparedAttachments = await buildResendAttachments(attachments);

  try {
    const response = await resend.emails.send({
      from: defaultFromEmail,
      to: recipients,
      subject,
      html,
      attachments: preparedAttachments.length > 0 ? preparedAttachments : undefined,
    });

    if (response?.error) {
      throw new Error(response.error.message || 'Falha ao enviar e-mail pelo Resend.');
    }

    console.log('Email enviado com sucesso:', {
      provider: 'resend',
      subject,
      to: recipients,
      emailId: response?.data?.id || null,
    });

    return response;
  } catch (error) {
    console.error('Erro ao enviar e-mail:', {
      provider: 'resend',
      subject,
      to: recipients,
      message: error?.message || error,
      stack: error?.stack,
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
          font-family: Arial, sans-serif;
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
          <p>Dúvidas? Contate-nos: suporte@comejaca.org.br</p>
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
  const intro = isResend ? `Prezado(a) ${name},` : `Olá ${name},`;
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
        <p>Este código é válido por 15 minutos.</p>
        <p>Atenciosamente,<br>${isResend ? 'Equipe de Tecnologia COMEJACA' : 'Equipe COMEJACA'}</p>
      `,
    }),
  });
}

async function sendAccountVerifiedEmail({ to, name }) {
  return sendEmail({
    to,
    subject: 'Conta Verificada',
    html: getBaseTemplate({
      title: 'Conta Verificada',
      contentHtml: `
        <p>Olá ${name},</p>
        <p>Informamos que seu acesso ao <strong>Portal COMEJACA</strong> foi verificado com sucesso.</p>
        <p>Agora você tem acesso completo ao sistema.</p>
        <p>Atenciosamente,<br>Equipe COMEJACA</p>
      `,
    }),
  });
}

async function sendResetEmail(email, resetLink, options = {}) {
  const { name = 'participante', expiresInMinutes = 15 } = options;

  try {
    return await sendEmail({
      to: email,
      subject: 'Redefinição de senha',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Redefinição de senha</title>
        </head>
        <body style="margin:0;padding:24px 0;background:#f8fafc;font-family:Arial,sans-serif;color:#334155;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 18px 40px rgba(17,24,39,0.08);">
            <div style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#111827;">
                <span style="color:#6480f7;">47º</span>
                <span style="margin-left:6px;letter-spacing:0.06em;">COMEJACA</span>
                <span style="margin-left:6px;color:#94a3b8;font-weight:600;">2026</span>
              </p>
              <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Sistema de inscrições</p>
            </div>
            <div style="padding:32px 28px;">
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.1;color:#111827;">Redefinição de senha</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">Olá, ${name}.</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                Recebemos uma solicitação para redefinir sua senha. Este link é temporário e expira em ${expiresInMinutes} minutos.
              </p>
              <div style="margin:0 0 24px;">
                <a
                  href="${resetLink}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display:inline-block;padding:14px 24px;background:#6480f7;color:#ffffff !important;text-decoration:none !important;border-radius:10px;font-size:15px;font-weight:600;"
                >
                  Redefinir senha
                </a>
              </div>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#64748b;">
                Se você não solicitou esta redefinição, ignore este e-mail.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">
                Caso o botão não funcione, copie e cole este link no navegador:<br />
                <span style="color:#6480f7;word-break:break-all;">${resetLink}</span>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', {
      to: email,
      message: error?.message || error,
      stack: error?.stack,
    });
    throw error;
  }
}

async function sendResetPasswordEmail({ to, name, resetLink, expiresInMinutes = 15 }) {
  return sendResetEmail(to, resetLink, { name, expiresInMinutes });
}

async function sendAttachmentEmail({ to, name, file, cc = [] }) {
  const recipients = [...normalizeRecipients(to), ...normalizeRecipients(cc)];

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
        <p>Obrigado por sua participação.<br />Equipe COMEJACA</p>
      `,
    }),
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendAccountVerifiedEmail,
  sendResetEmail,
  sendResetPasswordEmail,
  sendAttachmentEmail,
};
