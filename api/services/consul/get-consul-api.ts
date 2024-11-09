import { getAPI } from 'af-consul';
import { logger } from '../logger';
import em from '../ee.js';
import { config } from '../../bootstrap/init-config';

const isProd = (process.env.NODE_CONSUL_ENV || process.env.NODE_ENV) === 'production';

export const getConsulAPI = async () => getAPI({
  config,
  logger,
  em,
  envCode: isProd ? 'aitr01' : 'aite01',
  getConsulUIAddress: (serviceId: string) => `https://consul.entapp.work/ui/dc-${isProd ? 'msk-infra' : 'dev'}/services/${serviceId}/instances`,
});
