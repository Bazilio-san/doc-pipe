import { logger } from '../services/logger';
import { gracefulShutdown } from './graceful-shutdown';

process.on('uncaughtException', async (err) => {
  // Handle the error safely
  logger.error(err, 'Uncaught exception');
  await gracefulShutdown('SIGINT');
});

process.on('unhandledRejection', (reason, promise) => {
  // Handle the error safely
  logger.error({ promise, reason }, 'Unhandled Rejection at: Promise');
});

process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
