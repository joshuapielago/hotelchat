import { getConfig } from './config';
import { createServer } from './server';
import { logger } from './utils/logger';

async function main() {
  const config = getConfig();
  const app = createServer();

  app.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Ely AI Service started');
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start Ely AI Service');
  process.exit(1);
});
