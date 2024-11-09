/* eslint-disable import/order */
// ========== bootstrap =============

// 1) Эта строка ОБЯЗАНА быть первой, чтобы переменные окружения из .env загружались ПРЕЖДЕ ВСЕГО
import dotEnvResult from './bootstrap/dotenv';
// 2) Сразу после .env загружаем echo и при этом устанавливаем ему правильный loggerLevel
import { echo } from 'af-echo-ts';

// 3) После этого загружаем logger и устанавливаем его логгером в модуле af-db-ts
import { logger } from './services/logger';
import { setLogger } from 'af-db-ts';

setLogger(logger);

// 4) Инициализируем config
import { config } from './bootstrap/init-config';
import './bootstrap/error-handlers';

import { IRegisterCyclic } from 'af-consul';
import { initWebServer } from './services/web/server';
import { IWebApp } from './@types/web';
import { startupInfo } from './bootstrap/startup-info';
import { checkMainDB } from './services/db/pg-db';
// Инициализация поддержки i18n, загрузка переводов.
import { registerCyclic } from './services/consul/register';

// ========== bootstrap =============
let webApp: IWebApp;
let cyclicRegisterServiceInConsul: IRegisterCyclic;

const isTest = process.env.NODE_ENV === 'test';

export const start = async () => {
  try {
    // Output of the start diagnostics to the console.
    await startupInfo({ dotEnvResult, cfg: config });
    // Проверка доступности БД
    await checkMainDB();

    // Запуск WEB-севера
    webApp = await initWebServer();

    // Запуск циклической регистрации сервиса в consul
    cyclicRegisterServiceInConsul = await registerCyclic();
    if (!config.consul.service.noRegOnStart) {
      await cyclicRegisterServiceInConsul.start();
    }

    echo('Initialization complete');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
    process.exit(1);
  }
  return webApp;
};

if (!isTest) {
  start().then((r) => r);
}

export const stop = () => {
  webApp?.server?.close?.();
  cyclicRegisterServiceInConsul?.stop();
};
