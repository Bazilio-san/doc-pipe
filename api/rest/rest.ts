import { NextFunction, Request, Response } from 'express';
import { echo } from 'af-echo-ts';
import { config } from '../bootstrap/init-config';
import { debugWebHealth } from '../services/debug';
import { getClientFQDN } from '../services/web/common-functions';

export const restCore = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/v1')) {
    next();
    return;
  }
  const apiPath = req.path.replace(/^\/api\/v1\/?/, '');

  if (apiPath === 'health') {
    if (debugWebHealth.enabled) {
      getClientFQDN(req).then((remoteAddress) => {
        debugWebHealth(`HEALTH check from ${remoteAddress}`);
      });
    }
    return res.send(`Alive-Healthy (${config.name} v${config.version})`);
  }

  next();
};

export const rest = async (req: Request, res: Response, next: NextFunction) => {
  restCore(req, res, next).then(() => 0).catch((err) => {
    echo.error(err);
  });
};
