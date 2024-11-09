// noinspection UnnecessaryLocalVariableJS
import crypto from 'crypto';
import { boolEnv } from 'af-tools-ts';
import { echo } from 'af-echo-ts';
import { config } from '../../../bootstrap/init-config';
import { ICheckTokenResult } from './i-token';

const { permanentToken, serverToken, tokenLifeTimeSeconds } = config.webServer;

const ACCEPT_PERMANENT_TOKEN = boolEnv('ACCEPT_PERMANENT_TOKEN', false);
const ALGORITHM = 'aes-256-ctr';
const KEY = crypto
  .createHash('sha256')
  .update(String(config.webServer.tokenEncryptKey))
  .digest('base64')
  .substring(0, 32);

/**
 * Шифрует переданный текст симметричным ключом, взятым из конфига
 */
export const encrypt = (text: string): string => {
  const buffer = Buffer.from(text);
  // Create an initialization vector
  const iv = crypto.randomBytes(16);
  // Create a new cipher using the algorithm, key, and iv
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  // Create the new (encrypted) buffer
  const encryptedBuf = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
  return encryptedBuf.toString('hex');
};

/**
 * Дешифрует переданный текст симметричным ключом, взятым из конфига
 */
export const decrypt = (encryptedStr: string) => {
  const encryptedByf = Buffer.from(encryptedStr, 'hex');
  // Get the iv: the first 16 bytes
  const iv2 = encryptedByf.subarray(0, 16);
  // Get the rest
  const restBuf = encryptedByf.subarray(16);
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv2);
  // Actually decrypt it
  const decryptedBuf = Buffer.concat([decipher.update(restBuf), decipher.final()]);
  return decryptedBuf.toString();
};

/**
 * Создает токен, зашифровывая имя пользователя и время устаревания.
 * Для определения времени устаревания в скрипте формы JB, в начало токена
 * добавляется метка времени устаревания
 */
export const generateToken = (user: string, liveTimeSec?: number): string => {
  const expire = Date.now() + ((liveTimeSec || tokenLifeTimeSeconds) * 1000);
  const payload = `${(user || '').toLowerCase()}|${expire}`;
  return `${expire}.${encrypt(payload)}`;
};

export const tokenRE = /^(\d{13,})\.([\da-fA-F]{32,})$/;

/**
 * Проверяет валидность токена:
 * - пользователь должен совпадать
 * - время устаревания не должно быть просрочено
 * Сообщение доезжают до чата. В чат они попадают до '::'
 */
export const checkToken = (expectedUser: string, token: string, noCheckUser?: boolean): ICheckTokenResult => {
  token = (token || '').trim();
  if (!token) {
    return {
      user: null,
      expire: 0,
      errorReason: 'JWT Token not passed',
    };
  }

  if (token === serverToken) {
    return {
      user: expectedUser,
      expire: Date.now() + tokenLifeTimeSeconds,
      inTokenType: 's',
    };
  }

  if (ACCEPT_PERMANENT_TOKEN && token === permanentToken) {
    return {
      user: expectedUser,
      expire: Date.now() + tokenLifeTimeSeconds,
      inTokenType: 'p',
    };
  }

  const [, expireStrFromStart, encryptedPayload] = tokenRE.exec(token) || [];

  if (!expireStrFromStart) {
    return {
      user: null,
      expire: 0,
      errorReason: 'JWT Token does not match mask',
    };
  }
  let expire = Number(expireStrFromStart) || 0;
  let payload: string = '';
  try {
    payload = decrypt(encryptedPayload);
  } catch (err: Error | any) {
    echo.error(err);
    // Ошибка при декодировании токена
    return {
      user: null,
      expire,
      errorReason: `Error decrypting JWT token :: ${err.message}`,
    };
  }

  if (!expectedUser) {
    return {
      user: null,
      expire: 0,
      isTokenDecrypted: true,
      inTokenType: 'j',
      errorReason: 'Expected user not passed',
    };
  }
  const [user, expireStr] = payload.split('|');
  expire = Number(expireStr) || 0;

  if (!noCheckUser) {
    if (user.toLowerCase() !== expectedUser.toLowerCase()) {
      // Не совпал user
      return {
        user,
        expire,
        isTokenDecrypted: true,
        inTokenType: 'j',
        errorReason: `JWT Token: user not match :: Expected  '${expectedUser}' / obtained from the token: '${user}'`,
      };
    }
  }

  const expiredOn = Date.now() - expire;
  if (expiredOn > 0) {
    // Токен устарел
    return {
      user,
      expire,
      isTokenDecrypted: true,
      inTokenType: 'j',
      errorReason: `JWT Token expired :: on ${expiredOn} mc`,
    };
  }
  // OK!
  return { inTokenType: 'j', user, expire };
};
