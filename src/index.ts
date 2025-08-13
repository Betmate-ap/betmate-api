import { createApp } from './app';
import { logger } from './lib/logger';

const PORT = Number(process.env.PORT || 4000);

createApp()
  .then((app) => {
    app.listen(PORT, () => logger.info(`GraphQL API: http://localhost:${PORT}/graphql`));
  })
  .catch((err) => {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  });
