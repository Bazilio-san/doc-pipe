/* istanbul ignore file */
// noinspection JSUnusedGlobalSymbols

import config from 'config';
import { getAFLogger, logLevelIdByName } from 'af-logger-ts';
import { red, rs } from 'af-color';
import emitter from './ee';

const { level, prefix } = config.get<any>('logger');

export const { logger, fileLogger, exitOnError } = getAFLogger({
  minLevel: logLevelIdByName(level),
  name: prefix,
  filePrefix: prefix,
  // logDir,
  minLogSize: 0,
  minErrorLogSize: 0,
  emitter,
  fileLoggerMap: {
    info: 'info',
    error: 'error',
    fatal: 'error',
  },
  prettyErrorTemplate: `{{errorName}} ${red}{{errorMessage}}${rs}\n{{errorStack}}`,
});

// export const { loggerFinish } = fileLogger;
export const isSilly = logger.settings.minLevel < logLevelIdByName('silly');
// const isDebug = logger.settings.minLevel < logLevelIdByName('debug');
