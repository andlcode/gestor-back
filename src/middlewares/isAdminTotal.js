const prisma = require('../prisma');

const isAdminTotal = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (user.role !== 'admin_total') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores totais podem alterar pagamentos.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na verificação de admin_total:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
};

module.exports = { isAdminTotal };
