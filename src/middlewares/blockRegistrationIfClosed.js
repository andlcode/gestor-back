const {
  isRegistrationClosed,
  REGISTRATION_CLOSED_MESSAGE,
} = require('../config/registration');

const blockRegistrationIfClosed = async (req, res, next) => {
  try {
    if (await isRegistrationClosed()) {
      return res.status(403).json({
        success: false,
        message: REGISTRATION_CLOSED_MESSAGE,
      });
    }

    return next();
  } catch (error) {
    console.error('[blockRegistrationIfClosed] erro ao verificar status das inscrições:', {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: 'Não foi possível verificar o status das inscrições.',
    });
  }
};

module.exports = { blockRegistrationIfClosed };
