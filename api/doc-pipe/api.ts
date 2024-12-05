import { getLinksFromDb } from './get-links-from-db';
import { updateLinkCrawlErrorInDb } from './storage-lib';
import { getPagesContentByRecordset } from './get-pages-content-by-recordset';

// Если переданный параметр пустой, очищаются все ошибки
export const cleanCrawlErrors = async ({ pagesIds, blockId }: { pagesIds?: Array<number>, blockId?: number }): Promise<Array<any>> => {
  let where = '` "crawlError" IS NOT NULL `';
  if (Number.isInteger(blockId) && blockId !== -1) {
    where = ` "blockId" = ${blockId}) `;
  }
  if (Array.isArray(pagesIds)) {
    where = ` "linkId" IN (${pagesIds.filter((id: number) => Number.isInteger(id)).join()}) `;
  }
  const updatedLinks = await updateLinkCrawlErrorInDb({ crawlError: null, where });
  return updatedLinks;
};

// Если не передалн blockId - пойдем по всем страницам
export const crawlAllPages = async ({ blockId = -1, testMode = false }: { blockId?: number, testMode?: boolean }) => {
  if (testMode) await cleanCrawlErrors({ blockId });

  const linksList = await getLinksFromDb({ where: ` "deleted" = false AND "crawlError" IS null ${blockId !== -1 ? `AND "blockId" = ${blockId}` : ''}` });

  if (linksList.rows) getPagesContentByRecordset(linksList.rows);
  return 'success';
};

export const crawlPages = async ({ pagesIds = [], testMode = false }: { pagesIds: Array<number> | number, testMode?: boolean }) => {
  if (!Array.isArray(pagesIds)) pagesIds = [pagesIds];
  if (testMode) await cleanCrawlErrors({ pagesIds });

  const linksList = await getLinksFromDb({ where: ` "linkId" IN (${pagesIds.filter((id: number) => Number.isInteger(id)).join()}) ` });

  if (linksList.rows) getPagesContentByRecordset(linksList.rows);
  return 'success';
};

// export const stopCrawlee = async () => {
//   await stopCrawl();
//   return 'success';
// };
