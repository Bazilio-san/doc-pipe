import { echo } from 'af-echo-ts';
import { TABLE } from '../constants';
import { execMAIN } from '../services/db/pg-db';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import { getLinkMetadata } from './get-link-metadata';
import { getLinksFromDb } from '../doc-pipe/get-links-from-db';

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

export const updateLinksMetadata = async () => {
  const { sites } = await getLinksFromDb({ where: `use = true AND ("httpCode" != 200 OR type IS NULL OR "fileName" IS NULL) `, limit: 1000 });

  const processLinksGroup = async (urlList: string[]) => {
    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i];
      const result = await getLinkMetadata(url);
      await updateLink(url, result);
    }
  };
  const siteLinks = Object.values(sites).map((s) => [...s]);

  await Promise.all(siteLinks.map(processLinksGroup));
  process.exit();
};

updateLinksMetadata();
