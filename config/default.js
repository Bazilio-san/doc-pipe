const { name, productName, version, description } = require('../package.json');
const { host, port } = require('./local.ws-host-port');

const commonTimeout = 3_600_000; // 1ч

module.exports = {
  name,
  productName,
  version,
  description,
  logger: {
    // Уровень логирования в консоль
    level: 'info',
    // Уровень логирования на стороне админки
    socketLevel: 'info',
    // Префикс, используемый при логировании
    prefix: name,
  },
  db: {
    // Настройки подключений к БД Postgres
    postgres: {
      // Настройки подключений к конкретным БД
      dbs: {
        // Основная БД
        csbot: {
          host: 'localhost',
          port: 5432,
          database: '***',
          user: '***',
          password: '***',
        },
        // БД, используемая для работы модуля "Операторы" в админке
        person: {
          host: 'localhost',
          port: 5432,
          database: '***',
          user: '***',
          password: '***',
        },
      },
    },
  },
  webServer: {
    domain: 'finam.ru', // Используется для установки свойствы cookie.domain в production режиме
    host, // Хост web-сервиса
    port, // Обязательно задавать порт в local.js
    originHosts: ['localhost', '0.0.0.0'],
    permanentToken: '***', // Токен доступа к API проекта
    serverToken: '***', // Серверный токен доступа к эндпоинту /token
    tokenEncryptKey: '***', // Секретный ключ симметричного шифрования токена
    tokenLifeTimeSeconds: 60 * 6, // Время жизни JWT токена
  },
  consul: {
    check: {
      interval: '10s',
      timeout: '5s',
      deregistercriticalserviceafter: '3m',
    },
    agent: {
      reg: {
        host: null,
        port: 8500,
        secure: false,
        token: '***',
      },
      dev: {
        dc: 'dc-dev',
        host: 'consul.entapp.work',
        port: 443,
        secure: true,
        token: '***',
      },
      prd: {
        dc: 'dc-msk-infra',
        host: 'consul.entapp.work',
        port: 443,
        secure: true,
        token: '***',
      },
    },
    service: {
      name,
      instance: '???',
      version,
      description,
      tags: ['doc-pipe', 'AI', 'document processing', 'scrapping', 'GraphRAG', 'RAG', 'REST', 'API'],
      meta: { who: 'http://{address}:{port}/who' },
    },
  },
  openAiClientOptions: {
    baseURL: 'http://localhost:9999/v1', // Адрес прокси при обращении к OpenAI для скрытия обращений из RF
    apiKey: '***', // API ключ к OpenAI (см https://wiki.finam.ru/display/AI/CS-BOT "Доступ к API OpenAI")
    apiKeyName: '***', // Информационная величина. Для отображения в Админке
    rateLimits: {
      tokensPerMinute: 300_000, // gpt-4 - 300_000, gpt-4o - 2_000_000, gpt-4o-mini - 10_000_000
      requestsPerMinute: 10_000, // Наш - 10_000
    },
  },
};
