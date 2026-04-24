const express = require('express');

const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireAdminTotal } = require('../middlewares/requireAdminTotal');
const {
  getEvento,
  getEventoPublicCamisa,
  updateEvento,
} = require('../controllers/evento.controller');

const router = express.Router();

router.use((req, res, next) => {
  console.log(`[evento] nova requisição: ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/public/camisa', getEventoPublicCamisa);
router.get('/', isAuthenticated, requireAdminTotal, getEvento);
router.put('/', isAuthenticated, requireAdminTotal, updateEvento);

module.exports = router;
