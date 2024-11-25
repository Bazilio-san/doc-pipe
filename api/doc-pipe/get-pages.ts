import { getLinksFromDb } from './get-links-from-db';
import { getPagesByRecordset } from './get-pages-by-recordset';

const getLinkList = async () => {
  // const { sites } = await getLinksFromDb({ where: ` download = true AND type = 'html' `, limit: 1000 });
  const { rows } = await getLinksFromDb({ where: ` download = true AND type = 'html' `, limit: 3 });

  await getPagesByRecordset(rows || []);
  process.exit();
};

getLinkList();
