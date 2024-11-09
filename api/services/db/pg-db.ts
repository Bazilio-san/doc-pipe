import pgvector from 'pgvector/pg';
import { QueryResult, QueryResultRow } from 'pg';
import { queryPg } from 'af-db-ts';
import { echo } from 'af-echo-ts';
import { PG } from '../../constants';

export const queryMAIN = async <R extends QueryResultRow = any> (
  sqlText: string,
  sqlValues?: any[],
  throwError = false,
): Promise<QueryResult<R> | undefined> => queryPg<R>(
  PG.DB_ID.CSBOT,
  sqlText,
  sqlValues,
  throwError,
  undefined,
  [pgvector.registerType],
);
export const queryPerson = async <R extends QueryResultRow = any> (
  sqlText: string,
  sqlValues?: any[],
  throwError = false,
):
  Promise<QueryResult<R> | undefined> => queryPg<R>(PG.DB_ID.PERSON, sqlText, sqlValues, throwError);

export const checkMainDB = async () => {
  try {
    // noinspection SqlResolve
    await queryMAIN('SELECT count(*) FROM usr.list', undefined, true);
  } catch (err) {
    echo.error(`БД ${PG.DB_ID.CSBOT} не доступна`);
    process.exit();
  }
  try {
    // noinspection SqlResolve
    await queryPerson('SELECT name FROM glob.person LIMIT 1', undefined, true);
  } catch (err) {
    echo.error(`БД ${PG.DB_ID.PERSON} не доступна`);
    process.exit();
  }
};

export const execMAIN = async (arg: string | { sqlText: string, sqlValues?: any[], throwError?: boolean }): Promise<number | undefined> => {
  if (typeof arg === 'string') {
    arg = { sqlText: arg };
  }
  const res = await queryMAIN(arg.sqlText, arg.sqlValues, arg.throwError);
  // Если выполнятеся пакет SQL инструкций, то приходит recordset
  return Array.isArray(res) ? res.reduce((accum, item) => accum + (item?.rowCount ?? 0), 0) : res?.rowCount;
};

export const queryRsMAIN = async <R extends QueryResultRow = any> (arg: string | { sqlText: string, sqlValues?: any[], throwError?: boolean }): Promise<R[] | undefined> => {
  if (typeof arg === 'string') {
    arg = { sqlText: arg };
  }
  const res = await queryMAIN<R>(arg.sqlText, arg.sqlValues, arg.throwError);
  return res?.rows;
};
