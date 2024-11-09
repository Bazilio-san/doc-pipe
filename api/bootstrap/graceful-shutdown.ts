/* eslint-disable no-console */
import { closeAllPgConnectionsPg } from 'af-db-ts';

export const gracefulShutdown = async (signal?: string) => {
  console.log(`Received ${signal || '[graceful shutdown]'}, closing server...`);
  await closeAllPgConnectionsPg();
  // Other asynchronous closings
  process.exit(0);
};
