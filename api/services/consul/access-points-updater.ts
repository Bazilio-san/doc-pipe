import { accessPointsUpdater } from 'af-consul';
import { logger } from '../logger';
import em from '../ee';
import { config } from '../../bootstrap/init-config';

export default {
  start: () => accessPointsUpdater.start({ config, logger, em }, 10_000),
  stop: () => accessPointsUpdater.stop(),
};
