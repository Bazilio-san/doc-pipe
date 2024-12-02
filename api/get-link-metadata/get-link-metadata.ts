import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { echo } from 'af-echo-ts';
import { SocksProxyAgent } from 'socks-proxy-agent';
import https from 'https';
import { sleep } from 'af-tools-ts';
import { URL } from 'url';
import path from 'path';
import { shortHash } from 'af-crypto';
import { mimeTypeMap } from './mime-types-map';

const SOURCE_REQUEST_TIMEOUT_MILLIS = 10_000;
const SLEEP_TIMEOUT_MILLIS = 300;
const torProxyAgent = new SocksProxyAgent('socks://dev-ai-proxy.whotrades.net:8888');

export interface IGetResourceTypeArg {
  url: string,
  method?: 'HEAD' | 'GET',
  useProxy?: boolean,
  flag?: boolean,
}

export interface IGetResourceTypeRet {
  type?: string,
  fileName?: string,
  crawlError?: string,
  httpCode?: number,
  useProxy?: boolean
}

export const getTypeByContentType = (contentType?: string): string => {
  const ct = (contentType || '').split(';')[0];
  return mimeTypeMap[ct || ''];
};

export const getFileNameByUrl = (url: string): string => {
  const urlObj = new URL(url);
  return `${urlObj.host}--${path.basename(urlObj.pathname)}--${shortHash(url)}`;
};

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
    const type = getTypeByContentType(response.headers['content-type']);
    if (!type) {
      echo.warn(`Не удалось определить тип для ${url}`);
    }
    const fileName = getFileNameByUrl(url);
    return { type, httpCode: response.status, useProxy, fileName };
  } catch (error: AxiosError | any) {
    const { message, status, response: _r } = error as AxiosError;
    return { crawlError: message, httpCode: status, useProxy };
  }
};

export const getLinkMetadata = async (url: string): Promise<IGetResourceTypeRet> => {
  const arg: IGetResourceTypeArg = { url, method: 'HEAD', useProxy: false };
  let result = await getResourceTypeCore({ ...arg });
  if (!result.crawlError) {
    return result;
  }
  await sleep(SLEEP_TIMEOUT_MILLIS);
  result = await getResourceTypeCore({ ...arg, method: 'GET' });
  if (!result.crawlError) {
    return result;
  }
  arg.useProxy = true;
  await sleep(SLEEP_TIMEOUT_MILLIS);
  result = await getResourceTypeCore(arg);
  if (!result.crawlError) {
    return result;
  }
  await sleep(SLEEP_TIMEOUT_MILLIS);
  result = await getResourceTypeCore({ ...arg, method: 'GET', flag: true });
  return result;
};
