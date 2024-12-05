import { NextFunction, Request, Response } from 'express';
import { echo } from 'af-echo-ts';
import { config } from '../bootstrap/init-config';
import { debugWebHealth } from '../services/debug';
import { getClientFQDN } from '../services/web/common-functions';

import { cleanCrawlErrors, crawlAllPages, crawlPages } from '../doc-pipe/api';

type CrawlBody = {
  crawlType: 'all' | 'bulk',
  pagesIds: Array<number>,
  blockId: number,
  testMode: boolean
};

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

  if (apiPath.includes('doc-pipe')) {
    const body: CrawlBody = req.body as CrawlBody;
    switch (apiPath.split('/')[1]) {
      case 'clean': {
        if (!body.pagesIds && typeof body.blockId !== 'number') return res.status(422).send('Unprocessable Entity');
        cleanCrawlErrors({ pagesIds: body.pagesIds, blockId: body.blockId });
        return res.status(200).send('success');
      }
      case 'crawl': {
        if (!body.crawlType) return res.status(422).send('Unprocessable Entity');
        if (body.crawlType === 'all') {
          if (typeof body.blockId !== 'number' || typeof body.testMode !== 'boolean') return res.status(422).send('Unprocessable Entity');
          crawlAllPages({ blockId: body.blockId, testMode: body.testMode });
        } else if (body.crawlType === 'bulk') {
          if (!body.pagesIds || typeof body.testMode !== 'boolean') return res.status(422).send('Unprocessable Entity');
          crawlPages({ pagesIds: body.pagesIds, testMode: body.testMode });
        }
        return res.status(200).send('success');
      }
    }
  }

  next();
};

export const rest = async (req: Request, res: Response, next: NextFunction) => {
  restCore(req, res, next).then(() => 0).catch((err) => {
    echo.error(err);
  });
};
