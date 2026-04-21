const { body, validationResult } = require('express-validator');
const {
  meetsNewPasswordPolicy,
  NEW_PASSWORD_POLICY_MESSAGE,
} = require('../src/utils/passwordPolicy');

const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

const validateRegister = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .custom((value) => {
      if (!meetsNewPasswordPolicy(value)) {
        throw new Error(NEW_PASSWORD_POLICY_MESSAGE);
      }
      return true;
    }),
];

const validateVerification = [
  body('verificationCode').notEmpty().withMessage('Código de verificação é obrigatório'),
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [first] = errors.array({ onlyFirstError: true });
    return res.status(400).json({ error: first.msg });
  }
  next();
};

module.exports = {
  validateLogin,
  validateRegister,
  validateVerification,
  validateRequest,
};