const crypto = require('crypto');
const bcrypt = require('bcrypt');
const transporter = require('../config/mailer');

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const REQUIRED_MAIL_ENV_KEYS = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];

function getFrontendBaseUrl() {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}`
    : '';

  return (
    process.env.FRONTEND_URL ||
    process.env.VERCEL_FRONTEND_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    vercelUrl ||
    process.env.BASE_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '');
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function buildResetLink(token) {
  const url = new URL('/reset-password', getFrontendBaseUrl());
  url.searchParams.set('token', token);
  return url.toString();
}

async function sendPasswordResetEmail({ user, token }) {
  const resetLink = buildResetLink(token);
  const userName = user.name || 'participante';
  const missingMailEnv = REQUIRED_MAIL_ENV_KEYS.filter((key) => !process.env[key]);

  console.log('Tentando enviar email...');
  console.log('Reset link final:', resetLink);

  if (process.env.ENABLE_SMTP === 'false') {
    throw new Error('SMTP desativado por configuração (ENABLE_SMTP=false).');
  }

  if (missingMailEnv.length > 0) {
    throw new Error(`Configuração SMTP incompleta. Variáveis ausentes: ${missingMailEnv.join(', ')}`);
  }

  await transporter.verify();

  const info = await transporter.sendMail({
    from: `"COMEJACA" <${process.env.MAIL_USER}>`,
    to: user.email,
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
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">Olá, ${userName}.</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
              Recebemos uma solicitação para redefinir a sua senha. Este link é temporário e expira em 15 minutos.
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

  if (!Array.isArray(info?.accepted) || info.accepted.length === 0) {
    throw new Error(
      `O provedor SMTP não confirmou destinatários aceitos. Rejeitados: ${JSON.stringify(
        info?.rejected || []
      )}`
    );
  }

  console.log('Email enviado com sucesso:', {
    messageId: info?.messageId,
    accepted: info?.accepted,
    rejected: info?.rejected,
    response: info?.response,
  });

  return {
    info,
    resetLink,
  };
}

async function createPasswordResetToken(prisma, userId) {
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
    },
  });

  return rawToken;
}

async function requestPasswordReset(prisma, email) {
  const normalizedEmail = email.trim().toLowerCase();
  console.log('Forgot password solicitado para:', normalizedEmail);

  const user = await prisma.users.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
  });

  console.log('Usuário encontrado:', user?.email || null);

  if (!user) {
    return {
      success: false,
      reason: 'USER_NOT_FOUND',
      user: null,
    };
  }

  const token = await createPasswordResetToken(prisma, user.id);
  const emailResult = await sendPasswordResetEmail({ user, token });

  return {
    success: true,
    reason: 'EMAIL_SENT',
    user,
    token,
    resetLink: emailResult.resetLink,
    emailInfo: emailResult.info,
  };
}

async function validatePasswordResetToken(prisma, rawToken) {
  const tokenHash = hashResetToken(rawToken);
  const now = new Date();

  const passwordResetToken = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!passwordResetToken) {
    return {
      isValid: false,
      reason: 'invalid',
      token: null,
    };
  }

  if (passwordResetToken.expiresAt <= now) {
    await prisma.passwordResetToken.delete({
      where: { token: tokenHash },
    });
    return {
      isValid: false,
      reason: 'expired',
      token: null,
    };
  }

  return {
    isValid: true,
    reason: 'valid',
    token: passwordResetToken,
  };
}

async function consumePasswordResetToken(prisma, rawToken, newPassword) {
  const validationResult = await validatePasswordResetToken(prisma, rawToken);

  if (!validationResult.isValid) {
    return {
      success: false,
      reason: validationResult.reason,
      user: null,
    };
  }

  const passwordResetToken = validationResult.token;

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.users.update({
      where: { id: passwordResetToken.userId },
      data: {
        password: hashedPassword,
        resetTokenVersion: { increment: 1 },
      },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: passwordResetToken.userId },
    }),
  ]);

  return {
    success: true,
    reason: 'password_reset',
    user: passwordResetToken.user,
  };
}

module.exports = {
  RESET_TOKEN_TTL_MS,
  requestPasswordReset,
  validatePasswordResetToken,
  consumePasswordResetToken,
};
