const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth.routes');
const { verifyMailerConnection } = require('./config/mailer');

// Configuração inicial
dotenv.config()
const app = express()
const prisma = new PrismaClient()

/** Remove barra final para bater com o header Origin do navegador. */
function normalizeOrigin(url) {
  if (!url || typeof url !== 'string') return url
  return url.trim().replace(/\/+$/, '')
}

/** Origens permitidas (dev local + front em produção + env). */
function buildAllowedOrigins() {
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${String(process.env.VERCEL_URL).replace(/^https?:\/\//, '')}`
    : undefined

  const list = [
    process.env.FRONTEND_URL,
    process.env.VERCEL_FRONTEND_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    vercelUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://comejaca.org.br',
    'https://gestor-comejaca.vercel.app',
  ]

  const extra = process.env.CORS_EXTRA_ORIGINS
  if (extra) {
    extra.split(',').forEach((o) => list.push(o.trim()))
  }

  return new Set(list.filter(Boolean).map(normalizeOrigin))
}

const allowedOrigins = buildAllowedOrigins()

const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true)
    }
    const normalized = normalizeOrigin(origin)
    if (allowedOrigins.has(normalized)) {
      return callback(null, true)
    }
    callback(null, false)
  },
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))



app.use('/api/auth', authRoutes)
app.get('/api/health', async (req, res) => {
  let database = 'UP'

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    database = 'DOWN'
  }

  const status = database === 'UP' ? 'UP' : 'PARTIAL'

  res.status(200).json({
    status,
    database,
    timestamp: new Date().toISOString(),
  })
})



app.use((err, req, res, next) => {
  console.error(`🚨 Erro capturado: ${err.message}`)
  console.error('📌 Stack Trace:', err.stack)

  res.status(err.status || 500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  })
})


const server = app.listen(process.env.PORT || 4000, () => {
  console.log(`🚀 Servidor rodando na porta ${process.env.PORT || 4000}`)

  if (process.env.NODE_ENV !== 'production') {
    verifyMailerConnection().catch((error) => {
      console.error('Falha não bloqueante na verificação SMTP:', error)
    })
  }
})

const shutdown = async () => {
  console.log('\n🛑 Desligando servidor...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('✅ Servidor finalizado com sucesso')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

module.exports = { app, prisma };
