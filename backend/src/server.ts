import 'dotenv/config';
import { buildApp } from './app.js';

const PORT = Number(process.env.PORT) || 3333;
const HOST = '0.0.0.0';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`🚀 Servidor HTTP rodando em http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown: encerra conexões ativas com segurança ao receber sinal do sistema
  const signals = ['SIGINT', 'SIGTERM'] as const;
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Sinal ${signal} recebido. Encerrando servidor HTTP...`);
      await app.close();
      process.exit(0);
    });
  }
}

start();
