import urlParser from 'url';
import { TABLE } from '../constants';
import { queryRsMAIN } from '../services/db/pg-db';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';

interface ISite {
  [dn: string]: Set<string>
}

export const getLinksFromDb = async (arg: {
  where: string,
  limit?: number,
  orderBy?: string
}): Promise<{ sites: ISite, rows: ICoreDlinkRecord[] | undefined }> => {
  const { where, limit, orderBy } = arg;
  const sql = `---
    SELECT *
    FROM ${TABLE.DLINK} 
    ${where ? `WHERE ${where}` : ''} 
    ${orderBy ? `ORDER BY ${orderBy}` : ''} 
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  const rows = (await queryRsMAIN<ICoreDlinkRecord>(sql)) || [];
  const urls = rows.map((r) => r.url);

  const sites: ISite = {};
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
  return { sites, rows };
};
