import express, { NextFunction, Request, Response } from 'express';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { expressCspHeader, INLINE, NONE, SELF, UNSAFE_EVAL } from 'express-csp-header';
import { Server } from 'http';
import { echo } from 'af-echo-ts';
import { yellow, green, cyan } from 'af-color';
import requestIp from 'request-ip';
import socketIO from './socket-io';
import cors from './cors';
import { commonREST, requestSourceMW } from './common-functions';
import { IWebApp } from '../../@types/web';
import { config } from '../../bootstrap/init-config';
import { rest } from '../../rest/rest';
import { swaggerDocs } from '../../rest/swagger/swagger';
import { GEN_FILES_DIR, ROOT_PROJECT_DIR } from '../../constants';
import { debugWebAll } from '../debug';
import { faviconSvg } from './favicon-svg';

const { name, webServer: { host, port } } = config;

const app: express.Express = express();

const webApp: IWebApp = { app, server: null as unknown as Server };

export const initWebServer = async (): Promise<IWebApp> => {
  const corsOptions = cors(app);
  if (debugWebAll.enabled) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const { authorization: a } = req.headers;
      const a2 = a ? `${green}, req.headers.authorization: ${cyan}${a}` : ';';
      echo(`${green}req.path: ${cyan}${req.path}${a2}`);
      next();
    });
  }

  app.disable('x-powered-by'); // less hackers know about our stack

  return new Promise((resolve, reject) => {
    try {
      webApp.server = app.listen({ port, host }, () => {
        echo.g(`
================================================================
Application ${yellow}${name}${green} started
Server listening on http://${host}:${port}, http://localhost:${port}
================================================================`);

        socketIO(webApp, corsOptions);

        app.use(faviconSvg(path.join(ROOT_PROJECT_DIR, 'pub/favicon/favicon.svg')));

        app.use(expressCspHeader({
          directives: {
            'default-src': [SELF], // Default to only allow content from the current site
            'img-src': [SELF], // Allow images from current site
            'object-src': [NONE], // Don't allow objects such as Flash and Java
            'script-src': [SELF, INLINE, UNSAFE_EVAL],
            'style-src': [SELF, 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/', INLINE],
            'font-src': [SELF, 'https://fonts.googleapis.com/', 'https://fonts.gstatic.com/', INLINE],
            'frame-src': [SELF],
            'form-action': [SELF], // Allow forms to submit only to the current site
            'worker-src': [NONE],
            'block-all-mixed-content': true,
          },
        }));

        // Статические файлы берутся из ./pub:
        app.use('/pub', express.static(path.join(ROOT_PROJECT_DIR, 'pub')));
        // view engine setup
        app.set('views', path.join(ROOT_PROJECT_DIR, 'api/services/web/views'));
        app.set('view engine', 'pug');

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        app.use(cookieParser());

        app.use(requestIp.mw());

        app.use(requestSourceMW);

        // health, /about - доступны всем
        app.use(commonREST);

        // doc-pipe-api доступен без NTLM аутентификации, но "закрыт" JWT
        app.use(rest);
        // swagger для doc-pipe-api - доступен всем
        swaggerDocs(app);

        // Эти статические ресурсы можно отдавать только авторизованным пользователям
        app.use('/files', express.static(path.join(ROOT_PROJECT_DIR, GEN_FILES_DIR), { index: false }));

        app.use((req, res) => {
          res.status(404).render('404');
        });

        resolve(webApp);
      });
    } catch (err) {
      reject(err);
    }
  });
};
