export interface IGptModel {
  model: string,
  kTokens: number,
  inPrice: number,
  outPrice: number,
  inBatchPrice: number,
  outBatchPrice: number,
}

export interface IGptModels {
  [model: string]: IGptModel
}
