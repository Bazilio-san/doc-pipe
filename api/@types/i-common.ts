export interface ICommonResult<R = any, E = any, N = any> {
  result?: R,
  error?: E,
  notify?: N,
}

export interface ICommonResultR<R = any, E = any, N = any> {
  result: R,
  error?: E,
  notify?: N,
}
