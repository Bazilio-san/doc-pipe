/* eslint-disable no-continue,no-cond-assign,no-bitwise,no-mixed-operators,no-irregular-whitespace */

import { md5UID } from 'af-crypto';
import { PoolClient } from 'pg';
import * as fs from 'fs-extra';
import * as path from 'path';

export const decodeHTMLEntities = (text: string): string => {
  const entities = [
    ['amp', '&'],
    ['apos', '\''],
    ['#x27', '\''],
    ['#x2F', '/'],
    ['#39', '\''],
    ['#47', '/'],
    ['lt', '<'],
    ['gt', '>'],
    ['nbsp', ' '],
    ['quot', '"'],
  ];

  // eslint-disable-next-line no-plusplus
  for (let i = 0, max = entities.length; i < max; ++i) {
    text = text.replace(new RegExp(`&${entities[i][0]};`, 'g'), entities[i][1]);
  }

  return text;
};

export const trim = (v: any): string => String(v == null ? '' : v).trim();

export const removeLf = (s: string): string => (s || '').replace(/\n+/g, ' ').replace(/ {2,}/g, ' ');

export const stripHTML = (s: string): string => {
  s = trim(s);
  if (!s) {
    return '';
  }
  s = s.replace(/<\/?[^>]+>/ig, '')
    .replace(/ /sg, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&bull;/g, '')
    .replace(/&[lr]aquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/{html}/g, '')
    .replace(/&apos;/g, '\'')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, '\'')
    .replace(/&#39;/g, '\'')
    .replace(/&#x2F;/g, '/')
    .replace(/&#47;/g, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/(\s*[\r\n]){2,}/g, '\n')
    .trim();
  if (/&\w{4,8};/.test(s)) {
    s = s.replace(/&\w{4,8};/g, '');
  }
  return s.trim();
};

export const normalizeText = (s: any): string => {
  s = trim(s);
  s = s.replace(/\s+/sg, ' ').toLowerCase();
  return s;
};

export const hashOfText = (s: any): string => md5UID(normalizeText(s));

export const pgVectorFromSql = (value: string) => value.substring(1, value.length - 1).split(',').map((v) => parseFloat(v));

export const pgVectorToSql = (value: number[]) => JSON.stringify(value);

export const registerPgVectorType = async (client: PoolClient) => {
  const result = await client.query(`---
    SELECT typname, oid, typarray FROM pg_type WHERE typname = $1`, ['vector']);
  if ((result.rowCount || 0) >= 1) {
    const { oid } = result.rows[0];
    // @ts-ignore
    client.setTypeParser(oid, 'text', (value) => pgVectorFromSql(value));
  }
};

export const icon = (name: string) => `<svg class="q-icon" viewBox="0 0 24 24"><use xlink:href="/pub/sprite/my/symbols.svg#${name}"></use></svg>`;

export const sanitize = (payload: any) => {
  try {
    payload = JSON.parse(JSON.stringify(payload));
  } catch (err) {
    //
  }
  return payload;
};

export const getFiles = (dir: string, files: string[] = []) => {
  dir = fs.realpathSync(dir);

  files = files || [];
  const filesInDir = fs.readdirSync(dir);
  filesInDir.forEach((fileOrDir) => {
    const name = `${dir}/${fileOrDir}`;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(path.normalize(name));
    }
  });
  return files;
};

export const onlyChars = (s: string) => s.replace(/[^a-zа-я]+/ig, '').replace(/[rn]+/g, '');

export const isTextIncludes = (search: string, text: string) => onlyChars(text).includes(onlyChars(search));

export const tryJsonParse = <T = any> (s: string, defaultValue?: any): T => {
  try {
    return JSON.parse(s);
  } catch (err: Error | any) {
    return defaultValue;
  }
};

export const newId = () => `id${Math.floor(Math.random() * (999999 - 1)) + 1}`;

export const toSrcPath = (dirname: string): string => dirname.replace(/[/\\]api[/\\]@dist/, '');

export const getAsset = (fileName: string, dirname: string = __dirname) => fs.readFileSync(path.join(toSrcPath(dirname), 'asset', fileName), 'utf8');

export const replaceAll = (text: string, search: string, replacement: string): string => text.split(search).join(replacement);
