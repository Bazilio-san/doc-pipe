/*
Output of startup diagnostics to the console
*/
import { configInfo, consulInfo, databasesInfo, infoBlock, nodeConfigEnvInfo } from 'af-tools-ts';
import { yellow } from 'af-color';
import { logger, fileLogger } from '../services/logger';
import { IConfig } from '../@types/config';
import { getConsulAPI } from '../services/consul/get-consul-api';

export const startupInfo = async (args: {
  dotEnvResult: any,
  cfg: IConfig
}) => {
  const { cfg, dotEnvResult } = args;
  const consulApi = await getConsulAPI();

  configInfo({ dotEnvResult, cfg: JSON.parse(JSON.stringify(cfg)) }); // To display you must set ENV DEBUG=config-info

  const info = infoBlock(
    {
      info: [
        `${yellow}${cfg.description} (v ${cfg.version})`,
        nodeConfigEnvInfo(),
        ['NODE VERSION', process.version],
        ['NODE_ENV', process.env.NODE_ENV],
        ['Logging level', cfg.logger.level],
        ['DEBUG', (process.env.DEBUG || '')],
        ['Logs dir', fileLogger.logDir],
        ...databasesInfo(cfg, ['staff', 'csbot', 'person']),
        ['Consul serviceId', consulApi.serviceId],
      ],
    },
  );
  logger.info(`\n${info}`);

  consulInfo(cfg);
};
