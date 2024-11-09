import { TLogLevelName } from 'af-logger-ts';
import { IAFDatabasesConfig } from 'af-db-ts';
import { IAFConsulConfig } from 'af-consul';

interface ICommonRootConfig {
  name?: string,
  version?: string,
  description?: string,
}

interface ILoggerConfig {
  logger: {
    level: TLogLevelName,
    socketLevel: TLogLevelName,
    prefix: string,
  },
}

interface IConsulConfig {
  consul: IAFConsulConfig
}

interface IWebServerConfig {
  webServer: {
    domain: string,
    host: string,
    port: number,
    originHosts: string[],
    permanentToken: string,
    serverToken: string,
    tokenEncryptKey: string,
    // Время жизни JWT токена
    tokenLifeTimeSeconds: number,
  },
}

export interface IConfig extends ICommonRootConfig,
  ILoggerConfig,
  IAFDatabasesConfig,
  IWebServerConfig,
  IConsulConfig {
  openAiClientOptions: {
    baseURL: string, // http://nya-cepr01-ap01.corp.whotrades.eu/v1
    apiKey: string, // apiKey OpenAI
    apiKeyName: string,
    rateLimits: {
      tokensPerMinute: number,
      requestsPerMinute: number,
    },
  },
  fork: {
    name: string,
    color: {
      primary: string,
      secondary: string,
      accent: string,
    },
  }
}
