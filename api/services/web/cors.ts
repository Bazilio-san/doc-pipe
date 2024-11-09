import cors from 'cors';
import { Express } from 'express';
import { config } from '../../bootstrap/init-config';

const { originHosts } = config.webServer;

const originTestRe = new RegExp(`https?:\\/\\/(${originHosts.join('|')})(:\\d+)?`, 'i');

export default (app: Express) => {
  const corsOptions = {
    // https://www.npmjs.com/package/cors#configuring-cors
    // origin: /https?:\/\/(localhost|af-config-service.finam.ru)(:\d+)?/
    origin (origin: any, callback: Function) {
      if (originTestRe.test(origin) || !origin) {
        callback(null, true);
      } else {
        callback(null, true);
        // callback(new Error('Not allowed by CORS'));
      }
    },
  };

  app.use(cors(corsOptions));
  return corsOptions;
};
