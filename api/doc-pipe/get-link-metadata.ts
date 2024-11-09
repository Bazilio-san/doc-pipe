import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { echo } from 'af-echo-ts';
import urlParser from 'url';
import { SocksProxyAgent } from 'socks-proxy-agent';
import https from 'https';
import { sleep } from 'af-tools-ts';
import { TABLE } from '../constants';
import { execMAIN, queryRsMAIN } from '../services/db/pg-db';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import { mimeTypeMap } from './mime-types-map';

const SOURCE_REQUEST_TIMEOUT_MILLIS = 10_000;
const SLEEP_TIMEOUT_MILLIS = 300;
const torProxyAgent = new SocksProxyAgent('socks://dev-ai-proxy.whotrades.net:8888');

const updateLink = async (url: string, values: Partial<ICoreDlinkRecord>): Promise<void> => {
  const data: string[] = [];
  const sqlValues: any[] = [url];
  Object.entries(values).forEach(([fieldName, value]) => {
    sqlValues.push(value);
    data.push(`"${fieldName}" = $${sqlValues.length}`);
  });
  // @formatter:off
  const sqlText = `UPDATE ${TABLE.DLINK} SET ${data.join(', ')} WHERE "url" = $1 `;
  // @formatter:on
  echo.info(`url: ${url}, ${Object.values(values).join(' | ')}`);
  await execMAIN({ sqlText, sqlValues });
};

interface IGetResourceTypeArg {
  url: string,
  method?: 'HEAD' | 'GET',
  useProxy?: boolean,
  flag?: boolean,
}

interface IGetResourceTypeRet {
  type?: string,
  crawlError?: string,
  httpCode?: number,
  useProxy?: boolean
}

const getResourceTypeCore = async (arg: IGetResourceTypeArg): Promise<IGetResourceTypeRet> => {
  const { url, method = 'HEAD', useProxy } = arg;
  try {
    const requestConfig: AxiosRequestConfig<any> = {
      method,
      url,
      timeout: SOURCE_REQUEST_TIMEOUT_MILLIS,
      insecureHTTPParser: true,
      headers: {
        'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
    };
    if (useProxy) {
      requestConfig.httpAgent = torProxyAgent;
      requestConfig.httpsAgent = torProxyAgent;
    } else if (/^https/i.test(url)) {
      requestConfig.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    const response = await axios(requestConfig);
    const ct = (response.headers['content-type'] || '').split(';')[0];
    const type = mimeTypeMap[ct || ''];
    if (!type) {
      echo.warn(`Не удалось определить тип для ${url}`);
    }
    return { type, httpCode: response.status, useProxy };
  } catch (error: AxiosError | any) {
    const { message, status, response } = error as AxiosError;
    return { crawlError: message, httpCode: status, useProxy };
  }
};

const getResourceType = async (url: string) => {
  const arg: IGetResourceTypeArg = { url, method: 'HEAD', useProxy: false };
  let result = await getResourceTypeCore({ ...arg });
  if (!result.crawlError) {
    return result;
  }
  sleep(SLEEP_TIMEOUT_MILLIS);
  result = await getResourceTypeCore({ ...arg, method: 'GET' });
  if (!result.crawlError) {
    return result;
  }
  arg.useProxy = true;
  sleep(SLEEP_TIMEOUT_MILLIS);
  result = await getResourceTypeCore(arg);
  if (!result.crawlError) {
    return result;
  }
  sleep(SLEEP_TIMEOUT_MILLIS);
  result = await getResourceTypeCore({ ...arg, method: 'GET', flag: true });
  return result;
};

const getLinkList = async () => {
  const sql = `
    SELECT *
    FROM ${TABLE.DLINK}
    WHERE 1 = 1
      AND   ("httpCode" != 200 OR type IS NULL)
    --  AND url = 'https://www.mql5.com/ru/articles/802'
    LIMIT 1000`;
  const rows = (await queryRsMAIN<ICoreDlinkRecord>(sql)) || [];
  const urls = rows.map((r) => r.url);

  const sites: { [dn: string]: Set<string> } = {};
  urls.forEach((url) => {
    const { host } = urlParser.parse(url, true);
    if (host) {
      if (!sites[host]) {
        sites[host] = new Set([url]);
      } else {
        sites[host].add(url);
      }
    }
  });

  const processLinksGroup = async (urlList: string[]) => {
    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i];
      const result = await getResourceType(url);
      await updateLink(url, result);
    }
  };
  const siteLinks = Object.values(sites).map((s) => [...s]);

  await Promise.all(siteLinks.map(processLinksGroup));
  process.exit();
};

getLinkList();
