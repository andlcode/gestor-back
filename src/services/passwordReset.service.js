const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendResetPasswordEmail } = require('./emailService');

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
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

  console.log('Tentando enviar email...');
  console.log('Reset link final:', resetLink);
  const info = await sendResetPasswordEmail({
    to: user.email,
    name: userName,
    resetLink,
    expiresInMinutes: 15,
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
