const prisma = require('../prisma');

const requireAdminTotal = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (user.role !== 'admin_total') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[evento][auth] erro ao validar admin_total:', {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

module.exports = { requireAdminTotal };
