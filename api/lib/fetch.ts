import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';
import { echo } from 'af-echo-ts';
import { debugFetch } from '../services/debug';

export interface IFetchMetaData {
  method?: 'GET' | 'POST',
  protocol?: 'http' | 'https',
  host: string,
  port?: string | number,
  path?: string,
  user?: string,
  pass?: string,
  query?: string,
  validateStatus?: Function,
  httpsAgent?: string,
  data?: any,
  timeout?: number,
  headers?: { [header: string]: string },
}

export const fetch = <T = any> (metaData: IFetchMetaData): Promise<AxiosResponse<T>> => {
  const {
    method = 'GET',
    protocol = 'http',
    host,
    port,
    path,
    user,
    pass,
    query: qs = '',
    validateStatus,
    httpsAgent,
    data,
    timeout = 30_000,
    headers = {},
  } = metaData;
  if (debugFetch.enabled) {
    debugFetch(`data: ${JSON.stringify(metaData)}`);
  }
  const apiSocket = `${host}${port ? `:${port}` : ''}`;
  const url = `${protocol}://${apiSocket}${path || ''}${qs || ''}`;
  return new Promise<AxiosResponse<T>>((resolve, reject) => {
    const requestConfig: AxiosRequestConfig<any> = {
      method,
      url,
      headers: { accept: 'application/json', ...headers },
      timeout,
    };

    if (protocol === 'https') {
      requestConfig.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    if (typeof validateStatus === 'function') {
      Object.assign(requestConfig, { validateStatus });
    }
    if (user && pass) {
      Object.assign(requestConfig, { auth: { username: user, password: pass } });
    }
    if (httpsAgent) {
      Object.assign(requestConfig, { httpsAgent });
    }
    if (data) {
      Object.assign(requestConfig, { data });
    }
    axios<T>(requestConfig).then((response) => {
      if (debugFetch.enabled) {
        debugFetch(`axios.response: ${JSON.stringify({ status: response.status, data: response.data })}`);
      }
      // @ts-ignore
      response.apiSocket = apiSocket;
      return resolve(response);
    }).catch((err: Error | any) => {
      err.apiSocket = apiSocket;
      const { code } = err;
      if (code === 'ECONNABORTED') {
        echo.error(`HTTP-FETCH ERROR: Request timed out\n${method} ${url}\n`);
      } else if (code === 'ECONNREFUSED' || code === 'ECONNRESET') {
        echo.error(`HTTP-FETCH ERROR: ${code}\n${method} ${url}\n`);
      }
      reject(err);
    });
  });
};
