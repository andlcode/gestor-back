/**
 * Testa o fluxo público: POST /api/auth/registrar + POST /api/auth/entrar
 *
 * Uso (com API no ar):
 *   cd backend
 *   set API_BASE_URL=http://localhost:4000   (PowerShell: $env:API_BASE_URL="http://localhost:4000")
 *   npm run test:auth-flow
 *
 * Variáveis opcionais: API_BASE_URL (padrão http://127.0.0.1:4000)
 */

const axios = require('axios');

const API_BASE = (process.env.API_BASE_URL || 'http://127.0.0.1:4000').replace(/\/+$/, '');

const strongPassword = 'Abcd1234!';

async function main() {
  const stamp = Date.now();
  const email = `auth-flow-test+${stamp}@example.com`;
  const name = `Teste Fluxo ${stamp}`;

  const registerUrl = `${API_BASE}/api/auth/registrar`;
  const loginUrl = `${API_BASE}/api/auth/entrar`;

  console.log('[test:auth-flow] API_BASE:', API_BASE);

  let registerRes;
  try {
    registerRes = await axios.post(
      registerUrl,
      { name, email, password: strongPassword },
      { validateStatus: () => true }
    );
  } catch (e) {
    console.error('[test:auth-flow] falha de rede no cadastro:', e.message);
    process.exitCode = 1;
    return;
  }

  if (registerRes.status !== 201) {
    console.error('[test:auth-flow] cadastro esperado 201, recebido:', registerRes.status, registerRes.data);
    process.exitCode = 1;
    return;
  }

  if (!registerRes.data?.token) {
    console.error('[test:auth-flow] cadastro sem token na resposta');
    process.exitCode = 1;
    return;
  }

  console.log('[test:auth-flow] cadastro ok (status 201, token presente)');

  let loginRes;
  try {
    loginRes = await axios.post(
      loginUrl,
      { email, password: strongPassword },
      { validateStatus: () => true }
    );
  } catch (e) {
    console.error('[test:auth-flow] falha de rede no login:', e.message);
    process.exitCode = 1;
    return;
  }

  if (loginRes.status !== 200) {
    console.error('[test:auth-flow] login esperado 200, recebido:', loginRes.status, loginRes.data);
    process.exitCode = 1;
    return;
  }

  if (!loginRes.data?.token) {
    console.error('[test:auth-flow] login sem token na resposta');
    process.exitCode = 1;
    return;
  }

  console.log('[test:auth-flow] login ok (status 200, token presente)');
  console.log('[test:auth-flow] concluído com sucesso.');
}

main();
