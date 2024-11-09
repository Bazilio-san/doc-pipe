import * as os from 'os';
import * as dns from 'dns';
import { ICache } from '../@types/interfaces';

export const minimizeCache = <T> (cache: ICache<T>, maxItems: number) => {
  const len = Object.keys(cache).length;
  if (len >= maxItems) {
    const sortedDesc = Object.entries(cache)
      .sort((a, b) => b[1].created - a[1].created);
    sortedDesc.splice(0, maxItems - 1);
    sortedDesc.map(([h]) => h).forEach((h) => {
      delete cache[h];
    });
  }
};

// Returns fully qualified domain name
export const getFQDN = (h?: string, withError?: boolean, onlyDomain?: boolean): Promise<string | null> => {
  h = h || os.hostname();
  return new Promise((resolve, reject) => {
    dns.lookup(h as string, { hints: dns.ADDRCONFIG }, (err: any, ip: string) => {
      if (err) {
        if (withError) {
          reject(err);
        } else {
          resolve(null);
        }
        return;
      }
      dns.lookupService(ip, 0, (err2, hostname) => {
        if (err2) {
          if (withError) {
            reject(err2);
          } else {
            resolve(null);
          }
          return;
        }
        if (onlyDomain && !/\.[a-z]+$/i.test(hostname)) {
          resolve(null);
          return;
        }
        resolve(hostname);
      });
    });
  });
};

const fqdnCache: ICache<string> = {};

export const getFQDNCached = async (...args: any[]): Promise<string | null> => {
  const hostNameOrIP = args[0] || os.hostname() || '-';
  minimizeCache(fqdnCache, 10);
  if (!fqdnCache[hostNameOrIP]) {
    const fqdn = await getFQDN(...args);
    if (fqdn) {
      fqdnCache[hostNameOrIP] = {
        created: Date.now(),
        value: fqdn,
      };
    }
  }
  return fqdnCache[hostNameOrIP]?.value || null;
};
