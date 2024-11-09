/* eslint-disable no-await-in-loop,no-plusplus */
import { echo } from 'af-echo-ts';
import { genTableInterfacePg, graceExit } from 'af-db-ts';
import * as path from 'path';
import { PG, ROOT_PROJECT_DIR, TABLE } from '../../constants';

const TABLE_INTERFACES_DIR = path.normalize(path.join(ROOT_PROJECT_DIR, 'api/@types/tables/'));

const tables = [
  [PG.DB_ID.CSBOT, TABLE.DLINK],
];

(async () => {
  for (let i = 0; i < tables.length; i++) {
    const [connectionId, commonSchemaAndTable] = tables[i];
    await genTableInterfacePg(connectionId, commonSchemaAndTable, TABLE_INTERFACES_DIR);
  }
  echo.g(`Generated ${tables.length} table interfaces in folder '.${
    TABLE_INTERFACES_DIR.replace(ROOT_PROJECT_DIR.replace(/\\/g, '/'), '')}/'`);
  await graceExit();
})();
