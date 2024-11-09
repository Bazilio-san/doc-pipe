// Основание выдачи нового токена: p: постоянный токен, s: серверный, j: JWT
type TInTokenType = 'p' | 's' | 'j';

export interface ICheckTokenResult {
  user: string | null,
  expire: number | 0,
  inTokenType?: TInTokenType
  // errorReason возвращается только в случае ошибки. Если он пуст, то проверка - OK
  errorReason?: string,
  isTokenDecrypted?: boolean,
}

export interface ITokenResponse {
  user: string,
  token: string,
  i?: TInTokenType
}
