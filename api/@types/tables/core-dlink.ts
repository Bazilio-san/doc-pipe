export interface ICoreDlinkRecord {
  linkId?: number,
  url: string,
  use?: boolean | null,
  download?: boolean | null,
  type?: string | null,
  descr?: string | null,
  js?: string | null,
  blockId: number,
  createdAt?: string | Date | number,
  createdBy: string,
  updatedAt?: string | Date | number,
  updatedBy: string,
  deleted?: boolean | null,
  loadAsPicture?: boolean | null,
  httpCode?: number | null,
  crawlError?: string | null,
  useProxy?: boolean | null,
}