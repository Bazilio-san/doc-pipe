import { TABLE } from '../constants';
import { queryMAIN } from '../services/db/pg-db';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';

export const updateLinkCrawlErrorInDb = async (arg: {
  crawlError: string | null,
  where: string,
  limit?: number,
  orderBy?: string
}): Promise<any | never[]> => {
  const { crawlError, where, limit, orderBy } = arg;
  const sql = `---
    UPDATE ${TABLE.DLINK} 
    SET "crawlError" = $1
    ${where ? `WHERE ${where}` : ''} 
    ${orderBy ? `ORDER BY ${orderBy}` : ''} 
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  const rows = (await queryMAIN<ICoreDlinkRecord>(sql, [crawlError])) || [];
  return rows;
};

export const updateLinkHttpCodeInDb = async (arg: {
  crawlError: string | null,
  where: string,
  limit?: number,
  orderBy?: string
}): Promise<any | never[]> => {
  const { crawlError, where, limit, orderBy } = arg;
  const sql = `---
    UPDATE ${TABLE.DLINK} 
    SET "htmlCode" = $1
    ${where ? `WHERE ${where}` : ''} 
    ${orderBy ? `ORDER BY ${orderBy}` : ''} 
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  const rows = (await queryMAIN<ICoreDlinkRecord>(sql, [crawlError])) || [];
  return rows;
};

