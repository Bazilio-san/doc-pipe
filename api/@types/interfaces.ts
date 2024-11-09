export interface ICache<T> {
  [hash: string]: {
    created: number,
    value: T
  }
}
