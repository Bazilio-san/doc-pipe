// noinspection UnnecessaryLocalVariableJS
import { NextFunction, Request, Response } from 'express';
import { durationMillisToHHMMSS } from 'af-tools-ts';
import { cyan, lBlue, magenta, red, reset } from 'af-color';
import { checkToken } from './token-core';
import { debugJbApiAuth } from '../../debug';

const extractToken = (req: Request): { user: string, token: string } => {
  const { authorization = '', user = '' } = req.headers;
  const token = authorization.replace(/^Bearer */, '');
  return { user: String(user).toLowerCase(), token };
};

export const debugAuth = (req: Request, code: number, message: string): { code: number, message: string } => {
  if (debugJbApiAuth.enabled) {
    const h = req.headers || {};
    h.dur = h['x-jb-ui-start'] ? durationMillisToHHMMSS(Date.now() - Number(h['x-jb-ui-start'])) : undefined;
    h.v = h['x-jb-ui-version'] || undefined;
    h.ip = h['x-real-ip'] || undefined;
    const obj = {};
    ['user', 'authorization', 'dur', 'v', 'ip', 'x-mode', 'host'].forEach((n) => {
      if (h[n] != null) {
        obj[n] = h[n];
      }
    });

    const headers = Object.entries(obj)
      .map(([k, v]) => `${cyan}${k}${lBlue}: ${magenta}${v}${reset}`)
      .join(', ');
    debugJbApiAuth(`${red}Unauthorized ${lBlue}${code}${red} ${message}${reset} Headers: ${headers}`);
  }
  return { code, message };
};

/**
 * Middleware получения нового токена.
 * Входной параметр должен содержать имя пользователя и серверный токен
 */
/*
// Пока не используется
export const getToken = async (
  req: Request<expressCore.ParamsDictionary, ITokenResponse | string>,
  res: Response<ITokenResponse | string>,
  endpoint: string,
) => {
  const { token: inToken, user } = extractToken(req);

  accessLog({ user, endpoint, method: req.method, ip: req.clientIp, payload: inToken });

  const checkResult = checkToken(user, inToken);
  if (checkResult.errorReason) {
    debugAuth(req, 401, checkResult.errorReason);
    return res.status(401).send(checkResult.errorReason);
  }
  const token = generateToken(user);

  debugJbApiAuth(`getToken[${req.clientIp}](user: ${user}, token [${checkResult.inTokenType || inToken}]:) => ${token}`);
  return res.send({ user, token, i: checkResult.inTokenType });
};
*/

/**
 * Проверяет авторизацию по токену.
 * Если все ОК, вернет undefined.
 * Иначе вернет объект с ошибкой
 */
export const getAuthByTokenError = (req: Request): { code: number, message: string } | undefined => {
  const { token: inToken, user } = extractToken(req);
  if (!inToken) {
    return debugAuth(req, 400, 'Missing authorization header');
  }
  const checkResult = checkToken(user, inToken);
  if (checkResult.errorReason) {
    return debugAuth(req, 401, checkResult.errorReason);
  }
};

export const authByToken = (req: Request, res: Response) => {
  const authError = getAuthByTokenError(req);
  if (authError) {
    res.status(authError.code).send(authError.message);
    return false;
  }
  return true;
};

export const authTokenMW = (req: Request, res: Response, next: NextFunction) => {
  const authError = getAuthByTokenError(req);
  if (authError) {
    res.status(authError.code).send(authError.message);
    return;
  }
  next();
};
