import { echo } from 'af-echo-ts';
import path from 'path';
import util from 'util';
import * as fs from 'fs-extra';
import { ICoreDlinkRecord } from '../@types/tables/core-dlink';
import { getFileNameByUrl, getTypeByContentType } from '../get-link-metadata/get-link-metadata';
import { queryMAIN } from '../services/db/pg-db';

export const getTypeAndFileName = async (link: ICoreDlinkRecord, response: any): Promise<{ type: string | null | undefined, fileName: string | undefined }> => {
  let { type, fileName } = link;
  if (type && fileName) {
    return { type, fileName };
  }
  const contentType = response?.headers()['content-type'];
  type = getTypeByContentType(contentType) || contentType;
  fileName = getFileNameByUrl(link.url);
  return { type, fileName };
};

const BASE_FILE_DIR_NAME = '_files';

export const BASE_FILE_DIR = path.resolve(path.join(process.cwd(), BASE_FILE_DIR_NAME));

if (!fs.existsSync(BASE_FILE_DIR)) {
  fs.ensureDirSync(BASE_FILE_DIR);
}

const saveFile = async (fileName: string, type: string, data: string | ArrayBuffer): Promise<string> => {
  const writeFile = util.promisify(fs.writeFile);
  const filePath = path.normalize(path.join(BASE_FILE_DIR, `${fileName}.${type}`));
  let content: Buffer;

  if (typeof data === 'string') {
    content = Buffer.from(data, 'utf-8'); // Convert string to Buffer
  } else {
    content = Buffer.from(new Uint8Array(data));
  }
  await writeFile(filePath, content);
  return filePath;
};

export const saveContentFromDbToDisk = async (linkId: number): Promise<void> => {
  try {
    const result = await queryMAIN(`---
SELECT content, "fileName", type FROM core.dlink WHERE "linkId" = ${linkId}`);
    const { content, fileName, type } = result?.rows[0] || {};
    if (!content || !fileName || !type) {
      throw new Error(`Incomplete data for linkId ${linkId}`);
    }
    const filePath = await saveFile(fileName, type, content);
    echo(`File saved to disk at ${filePath}`);
  } catch (error: any) {
    echo.error(`Error saving content to disk: ${error.message}`);
  }
};

export const saveContentToDb = async (
  linkId: number,
  fileName: string,
  type: string,
  data: string | ArrayBuffer,
): Promise<void> => {
  let content: Buffer;

  if (typeof data === 'string') {
    content = Buffer.from(data, 'utf-8'); // Convert string to Buffer
  } else {
    content = Buffer.from(new Uint8Array(data));
  }
  await queryMAIN(`---
    UPDATE core.dlink SET content = $1, type = '${type}', "fileName" = '${fileName}' WHERE "linkId" = ${linkId}`, [content]);
  echo.info(`Содержимое ссылки сохранено в БД для #${linkId} (${fileName}.${type})`);
};

export const getContentPath = (fileName: string, type: string): string => path.normalize(path.join(BASE_FILE_DIR, `${fileName}.${type}`));

export const js4print = (s: string) => `\n\`\`\`jsvaScript\n${s}\n\`\`\``;
