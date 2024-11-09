/* eslint-disable max-len */
import { NextFunction, Request, Response } from 'express';
import em from '../ee';
import { getFQDN } from '../../lib/fqdn';
import { config } from '../../bootstrap/init-config';
import { debugWebHealth } from '../debug';

export const { port, host } = config.webServer;

export const webServerAddress = `http://${host}:${port}`;

const remoteAddressCache = {};

const urlRE = /^[a-z][a-z0-9+\-.]*:\/\/(?:[a-z0-9\-._~%!$&'()*+,;=]+@)?([a-z0-9\-._~%]+|\[[a-z0-9\-._~%!$&'()*+,;=:]+])/i;

export const getClientFQDN = async (req: Request): Promise<string | undefined> => {
  let remote = req.clientIp || req.ip || 'undefined';
  remote = remote.replace(/^::ffff:/, '');
  if (remote) {
    if (!remoteAddressCache[remote]) {
      let remoteFQDN = remote;
      if (remote !== 'undefined') {
        remoteFQDN = await getFQDN(remote) || remote;
      }
      if (remoteFQDN) {
        remoteAddressCache[remote] = remoteFQDN;
      }
    }
    return remoteAddressCache[remote];
  }
  return undefined;
};

export const commonREST = (req: Request, res: Response, next: NextFunction) => {
  const { path: reqPath } = req;
  if (reqPath === '/health') {
    if (debugWebHealth.enabled) {
      getClientFQDN(req).then((remoteAddress) => {
        debugWebHealth(`HEALTH check from ${remoteAddress}`);
      });
    }
    em.emit('health-check');
    res.send(`Alive-Healthy (${config.name} v${config.version})`);
    return;
  }
  if (reqPath === '/about') {
    // res.header('Content-Type', 'text/markdown');
    // res.send(fs.readFileSync('./README.md'));
    res.send(config.version);
    return;
  }
  next();
};

export const http404 = (req: Request, res: Response) => {
  res.status(404).send('404 Not found');
};

export const setNoCacheHeaders = (res: Response): Response => {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Expires', '0');
  return res;
};
/**
 * Адрес сайта, с которого отправлен запрос
 * Н-р, doc-pipe-dev.ru
 */
export const requestSourceMW = async (req: Request, res: Response, next: NextFunction) => {
  const { referer, origin } = req.headers;
  if (referer) {
    const [, remoteHost] = urlRE.exec(referer) || [];
    if (remoteHost) {
      req.requestSource = remoteHost;
    } else if (origin) {
      const [, remoteHost2] = urlRE.exec(origin) || [];
      if (remoteHost2) {
        req.requestSource = remoteHost2;
      }
    }
  }
  next();
};
