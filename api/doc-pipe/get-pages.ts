import { getLinksFromDb } from './get-links-from-db';
import { getPagesContentByRecordset } from './get-pages-content-by-recordset';

const getLinkList = async () => {
  // const { sites } = await getLinksFromDb({ where: ` download = true AND type = 'html' `, limit: 1000 });
  const { rows } = await getLinksFromDb({ where: ` download = true AND type = 'html' `, limit: 7, orderBy: '"linkId"' });

  await getPagesContentByRecordset(rows || []);
  process.exit();
};

getLinkList();
