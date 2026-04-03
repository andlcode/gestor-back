const prisma = require('../prisma');

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.userId; // O middleware de autenticação deve definir `req.userId`

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    // Busca o usuário no banco de dados
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // admin_total herda todas as permissões de admin
    if (!['admin', 'admin_total'].includes(user.role)) {
      return res.status(403).json({ error: "Acesso negado. Apenas administradores podem editar instituições." });
    }

    req.user = user;
    next(); // Usuário é admin, prosseguir para a próxima função
  } catch (error) {
    console.error("Erro na verificação de admin:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
};
module.exports = { isAdmin };
