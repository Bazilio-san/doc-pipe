import { getLinksFromDb } from './get-links-from-db';
import { getPagesContentByRecordset } from './get-pages-content-by-recordset';
import { saveContentFromDbToDisk } from './storage-lib';

export const getLinkList = async () => {
  // Пример получения HTML и сохранения в поле content
  const { rows = [] } = await getLinksFromDb({ where: ` "isDownload" = true AND type = 'html' `, limit: 1, orderBy: '"linkId"' });
  await getPagesContentByRecordset(rows || []);
  // Проверка: получения HTML из поля content и сохранение на диск. Файл HTML должне нормально открываться и читаться
  for (let i = 0; i < rows.length; i++) {
    await saveContentFromDbToDisk(rows[i].linkId || 0);
  }

  // Пример получения pdf и сохранения в поле content
  const { rows: rows2 = [] } = await getLinksFromDb({
    where: ` "isDownload" = true AND type = 'pdf' AND url ILIKE '%www.finam.ru/dicwords/%'`,
    limit: 1,
    orderBy: '"linkId"',
  });
  await getPagesContentByRecordset(rows2 || []);
  // Проверка: получения PDF из поля content и сохранение на диск. Файл PDF должне нормально открываться и читаться
  for (let i = 0; i < rows2.length; i++) {
    await saveContentFromDbToDisk(rows2[i].linkId || 0);
  }

  process.exit();
};

getLinkList();
