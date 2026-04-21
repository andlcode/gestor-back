const express = require('express');
const fs = require('fs');

const { isAuthenticated } = require('../middlewares/authMiddleware.js');
const { isAdmin } = require('../middlewares/isAdmin.js');
const { isAdminTotal } = require('../middlewares/isAdminTotal.js');
const { verifyToken } = require('../middlewares/isVerify.js');

const {
  login,
  register,
  resendVerificationCode,
  verificar,
  validateToken,
  participante,
  obterInscricao,
  getparticipantes,
  criarInstituicao,
  listarInstituicoes,
  atualizarInstituicao,
  updateProfile,
  paymentId,
  resetPassword,
  validateResetPasswordToken,
  listarParticipantes,
  notificacao,
  AtualizarpaymentId,
  atualizarPerfil,
  updateInscricao,
  changePassword,
  gerarNovoLinkPagamento,
  enviarEmailComArquivo,
  enviarEmailRedefinicao,
  atendimentoFraterno,
} = require('../controllers/auth.controller.js');

const upload = require('../config/upload');

const {
  validateLogin,
  validateRegister,
  validateVerification,
  validateRequest,
} = require('../../validators/authValidator.js');

const router = express.Router();

/* =========================
   LOG DE REQUISIÇÕES
========================= */
router.use((req, res, next) => {
  console.log(`📥 Nova requisição: ${req.method} ${req.url}`);
  next();
});

/* =========================
   ROTAS PÚBLICAS
========================= */
router.post('/entrar', validateLogin, validateRequest, login);
router.post('/registrar', validateRegister, validateRequest, register);

/* =========================
   RECUPERAÇÃO DE SENHA
========================= */
// Solicita envio do e-mail com link de redefinição
router.post('/forgot-password', enviarEmailRedefinicao);

// Valida token de redefinição
router.get('/reset-password/validate', validateResetPasswordToken);

// Salva nova senha
router.post('/reset-password', resetPassword);

/* =========================
   ROTAS AUTENTICADAS
========================= */
router.post(
  '/verificar',
  isAuthenticated,
  validateVerification,
  validateRequest,
  verificar
);
router.post('/enviarcodigo', isAuthenticated, resendVerificationCode);
router.post('/validartoken', isAuthenticated, validateToken);

router.post('/inscrever', isAuthenticated, participante);
router.get('/obterinscricoes', isAuthenticated, getparticipantes);
router.get('/print/:participanteId', isAuthenticated, obterInscricao);

router.get('/pagamento/:id', isAuthenticated, paymentId);
router.get('/pagamentos', isAuthenticated, listarParticipantes);
router.put('/pagamentos/:id/status', isAuthenticated, isAdminTotal, AtualizarpaymentId);

router.put('/atualizarPerfil', isAuthenticated, atualizarPerfil);
router.put('/participante/:id', isAuthenticated, updateInscricao);

router.post('/novo-link', isAuthenticated, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'ID do participante não fornecido.',
    });
  }

  try {
    const resultado = await gerarNovoLinkPagamento(id);

    if (resultado.success) {
      return res.status(200).json(resultado);
    }

    return res.status(500).json(resultado);
  } catch (error) {
    console.error('Erro ao gerar novo link de pagamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar novo link de pagamento.',
    });
  }
});

/* =========================
   INSTITUIÇÕES
========================= */
// Se quiser deixar pública, mantenha assim.
// Se quiser proteger, adicione isAuthenticated.
router.get('/instituicoes', listarInstituicoes);

router.post('/novainstituicao', isAuthenticated, isAdmin, criarInstituicao);
router.put('/editarinstituicao/:id', isAuthenticated, atualizarInstituicao);

/* =========================
   PERFIL / ADMIN
========================= */
router.put('/updateProfile/:id', isAuthenticated, isAdmin, updateProfile);
router.post('/administrator-senha', verifyToken, isAdmin, changePassword);
router.get('/atendimentofraterno', verifyToken, isAdmin, atendimentoFraterno);

/* =========================
   MERCADO PAGO
========================= */
router.post('/mercadopago/notificacao', notificacao);

/* =========================
   ENVIO DE COMPROVANTE
========================= */
router.post(
  '/enviar-comprovante',
  upload.single('arquivo'),
  async (req, res) => {
    const { nomeCompleto, email } = req.body;
    const arquivo = req.file;

    if (!nomeCompleto || !email || !arquivo) {
      return res.status(400).json({
        erro: 'Nome completo, email e arquivo são obrigatórios.',
      });
    }

    try {
      await enviarEmailComArquivo(nomeCompleto, email, arquivo);

      return res.status(200).json({
        mensagem: 'Comprovante enviado com sucesso!',
      });
    } catch (err) {
      console.error('Erro ao enviar comprovante:', err);
      return res.status(500).json({
        erro: err.message || 'Erro ao enviar comprovante.',
      });
    } finally {
      fs.unlink(arquivo.path, (unlinkError) => {
        if (unlinkError) {
          console.error('Erro ao remover arquivo temporário:', unlinkError);
        } else {
          console.log('Arquivo temporário removido:', arquivo.path);
        }
      });
    }
  }
);

/* =========================
   MIDDLEWARE GLOBAL DE ERRO
========================= */
router.use((err, req, res, next) => {
  console.error('💥 Erro:', err.message);
  return res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = router;