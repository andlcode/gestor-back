/**
 * Valida o bloqueio de novas inscrições (registrationsOpen no evento ativo).
 *
 * Uso:
 *   cd backend
 *   npm run test:registration-closed
 *
 * Opcional (API no ar + inscrições fechadas no evento ativo):
 *   set API_BASE_URL=http://localhost:4000
 *   set TEST_INSCRICAO_TOKEN=<jwt de usuário verificado>
 */

const axios = require('axios');

function assert(condition, message) {
  if (!condition) {
    console.error('[test:registration-closed][FAIL]', message);
    process.exitCode = 1;
    return false;
  }

  console.log('[test:registration-closed][OK]', message);
  return true;
}

function loadModulesWithRegistrationOpen(registrationsOpen) {
  const prismaPath = require.resolve('../src/prisma');
  delete require.cache[prismaPath];
  delete require.cache[require.resolve('../src/services/registrationStatus')];
  delete require.cache[require.resolve('../src/config/registration')];
  delete require.cache[require.resolve('../src/middlewares/blockRegistrationIfClosed')];

  require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: {
      evento: {
        findFirst: async () => ({ registrationsOpen }),
      },
    },
  };

  return {
    registration: require('../src/config/registration'),
    middleware: require('../src/middlewares/blockRegistrationIfClosed'),
  };
}

async function testConfigAndMiddleware() {
  const closed = loadModulesWithRegistrationOpen(false);
  const { isRegistrationClosed, REGISTRATION_CLOSED_MESSAGE } = closed.registration;
  const { blockRegistrationIfClosed } = closed.middleware;

  assert(
    (await isRegistrationClosed()) === true,
    'isRegistrationClosed retorna true quando registrationsOpen=false'
  );
  assert(
    REGISTRATION_CLOSED_MESSAGE === 'As inscrições estão encerradas no momento.',
    'mensagem centralizada do backend está correta'
  );

  let blockedStatus = null;
  let blockedBody = null;
  await blockRegistrationIfClosed({}, {
    status(code) {
      blockedStatus = code;
      return this;
    },
    json(body) {
      blockedBody = body;
      return this;
    },
  }, () => {
    blockedStatus = 200;
  });

  assert(blockedStatus === 403, 'middleware bloqueia POST /inscrever com HTTP 403');
  assert(
    blockedBody?.message === REGISTRATION_CLOSED_MESSAGE,
    'middleware retorna a mensagem de inscrições encerradas'
  );

  const open = loadModulesWithRegistrationOpen(true);
  let nextCalled = false;
  await open.middleware.blockRegistrationIfClosed({}, {
    status() {
      return this;
    },
    json() {
      return this;
    },
  }, () => {
    nextCalled = true;
  });

  assert(nextCalled === true, 'middleware permite fluxo quando registrationsOpen=true');
  assert(
    (await open.registration.isRegistrationClosed()) === false,
    'isRegistrationClosed retorna false quando aberto'
  );
}

async function testApiIfConfigured() {
  const token = process.env.TEST_INSCRICAO_TOKEN;
  const apiBase = (process.env.API_BASE_URL || '').replace(/\/+$/, '');

  if (!token || !apiBase) {
    console.log('[test:registration-closed] pulando teste de API (defina API_BASE_URL e TEST_INSCRICAO_TOKEN)');
    return;
  }

  const response = await axios.post(
    `${apiBase}/api/auth/inscrever`,
    { nomeCompleto: 'Teste Bloqueio' },
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: () => true,
    }
  );

  assert(response.status === 403, 'API retorna 403 ao tentar criar inscrição');
  assert(
    response.data?.message === 'As inscrições estão encerradas no momento.',
    'API retorna mensagem de inscrições encerradas'
  );
}

async function main() {
  await testConfigAndMiddleware();
  await testApiIfConfigured();

  if (process.exitCode) {
    console.error('[test:registration-closed] concluído com falhas.');
    return;
  }

  console.log('[test:registration-closed] concluído com sucesso.');
}

main().catch((error) => {
  console.error('[test:registration-closed] erro inesperado:', error);
  process.exitCode = 1;
});
