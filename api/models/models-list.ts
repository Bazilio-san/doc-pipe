import { rn } from 'af-tools-ts';
import { openAiEmbeddingModelsDataArr } from '../lib/embedding-models';
import { IGptModels } from './i-models';

// VVQ !!! После изменения списка моделей выполни 'npm run cb' !!!
// https://platform.openai.com/docs/models
// Цены указаны за 1млн токенов https://openai.com/api/pricing/
export const openAiModelsData: [string, number, number, number, number?, number?][] = [
  /**
   * 0 - model,
   * 1 - контекст КБ,
   * 2 - цена input tokens $/млн,
   * 3 - цена output tokens $/млн
   * 4 - цена Batch API input tokens $/млн,
   * 5 - цена Batch API output tokens $/млн
   */

  ['chatgpt-4o-latest', 128, 5, 15, 2.5, 7.5],
  ['gpt-4o', 128, 5, 15, 2.5, 7.5], // gpt-4o-2024-08-06
  ['gpt-4o-2024-08-06', 128, 2.5, 10, 1.25, 5],
  ['gpt-4o-2024-05-13', 128, 5, 15, 2.5, 7.5],

  ['gpt-4o-mini', 128, 0.15, 0.6], // gpt-4o-mini-2024-07-18
  ['gpt-4o-mini-2024-07-18', 128, 0.15, 0.6],

  ['o1-preview', 128, 15, 60, 15, 60],
  ['o1-preview-2024-09-12', 128, 15, 60, 15, 60],
  ['o1-mini', 128, 3, 12, 3, 12],
  ['o1-mini-2024-09-12', 128, 3, 12, 3, 12],

  ['gpt-4o-realtime-preview', 128, 5, 20, 5, 20],
  ['gpt-4o-realtime-preview-2024-10-01', 128, 5, 20, 5, 20],

  ['gpt-4o-audio-preview', 128, 2.5, 10, 2.5, 10],
  ['gpt-4o-audio-preview-2024-10-01', 128, 2.5, 10, 2.5, 10],

  ['gpt-4-turbo-preview', 128, 10, 30],
  ['gpt-4-0125-preview', 128, 10, 30],
  ['gpt-4-1106-preview', 128, 10, 30],
  ['gpt-4-vision-preview', 128, 10, 30],

  ['gpt-4-turbo => gpt-4-turbo-2024-04-09', 128, 10, 30],
  ['gpt-4 => gpt-4-0613', 8.192, 30, 60],
  ['gpt-4-32k => gpt-4-32k-0613', 32.768, 60, 120],
  ['gpt-4-0314', 8.192, 30, 60], // Legacy
  ['gpt-4-32k-0314', 32.768, 60, 120], // Legacy

  ['gpt-3.5-turbo-0125', 16.385, 0.5, 1.5],
  ['gpt-3.5-turbo-1106', 16.385, 1, 2],
  ['gpt-3.5-turbo-instruct', 4.096, 1.5, 2],

  ['gpt-3.5-turbo => gpt-3.5-turbo-0125', 4.096, 0.5, 1.5], // Legacy
  ['gpt-3.5-turbo-16k => gpt-3.5-turbo-16k-0613', 16.385, 3, 4], // Legacy
  ['gpt-3.5-turbo-0301', 4.096, 1.5, 2], // Legacy

  ['babbage-002', 1, 0.4, 0.4],
  ['gpt-3.5-turbo-instruct-0914', 1, 1.5, 2],

  ['dall-e-2', 1, 0.02, 0.02],
  ['dall-e-3', 1, 0.04, 0.04],
  ['tts-1', 1, 15, 15],
  ['tts-1-hd-1106', 1, 30, 30],
  ['tts-1-1106', 1, 15, 15],
  ['tts-1-hd', 1, 30, 30],
  ['whisper-1', 1, 0.006, 0.006],
  ['davinci-002', 1, 2, 2],

  // ['ft:gpt-3.5-turbo-0613:personal::8bEsXTLZ', 4.096, 0.003, 0.006],
];

openAiModelsData.push(...openAiEmbeddingModelsDataArr);
/*
gpt-3.5-turbo, gpt-4, and gpt-4-turbo-preview point to the latest model version.
You can verify this by looking at the response object after sending a request.
The response will include the specific model version used (e.g. gpt-3.5-turbo-0613).
 */

export const openAiModelsHash: IGptModels = openAiModelsData.reduce((accum: IGptModels, item) => {
  // Здесь цены - в USD за 1 млн токенов
  const [models0, kTokens, inPrice, outPrice, inBPrice, outBPrice] = item;
  const inBatchPrice = inBPrice || inPrice;
  const outBatchPrice = outBPrice || outPrice;
  const models = models0.split(/ +=> +/);
  models.forEach((model) => {
    // Результирующие цены - в USD за 1 млн токенов
    accum[model] = { model, kTokens, inPrice, outPrice, inBatchPrice, outBatchPrice };
  });
  return accum;
}, {});

export const excludedModels = new Set([
  'ada-code-search-code',
  'ada-code-search-text',
  'ada-search-document',
  'ada-search-query',
  'babbage-002',
  'babbage-search-document',
  'babbage-search-query',
  'curie-search-document',
  'curie-search-query',
  'dall-e-2',
  'dall-e-3',
  'davinci-002',
  'davinci-search-document',
  'davinci-search-query',

  'gpt-4o-realtime-preview',
  'gpt-4o-realtime-preview-2024-10-01',

  'gpt-4o-audio-preview',
  'gpt-4o-audio-preview-2024-10-01',

  'gpt-4o-2024-05-13',
  'gpt-4o-2024-08-06',
  'gpt-4o-mini-2024-07-18',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4-0613',
  'gpt-4-32k-0613',
  'gpt-4-turbo-2024-04-09',
  'gpt-4-0125-preview',
  'gpt-4-vision-preview',
  'gpt-4-1106-vision-preview',
  'gpt-3.5-turbo-16k-0613',
  'gpt-3.5-turbo-0301',
  'gpt-3.5-turbo-0613',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-instruct',
  'gpt-3.5-turbo-instruct-0914',
  'text-embedding-ada-002',
  'text-embedding-3-large',
  'text-embedding-3-small',
  'tts-1',
  'tts-1-1106',
  'tts-1-hd',
  'tts-1-hd-1106',
  'whisper-1',
  'o1-preview',
  'o1-mini',
  'o1-mini-2024-09-12',
]);

/**
 * Цена в $
 */
export const getPriceForModelUSD = (arg: {
  model: string,
  inTokens?: number,
  outTokens?: number,
  precision?: number
}): number => {
  /**
   * @param inPrice - Цена в USD за 1 тысячу токенов
   * @param outPrice - Цена в USD за 1 тысячу токенов
   * @return - сумму в USD с точностью до указанного знака
   */
  const res = (inPrice: number, outPrice: number): number => rn(
    (((arg.inTokens || 0) * inPrice) + ((arg.outTokens || 0) * outPrice)) / 1_000_000,
    arg.precision || 8,
  );
  const data = openAiModelsHash[arg.model];
  return data ? res(data.inPrice, data.outPrice) : 0;
};

const embedModelsWithoutDimensions = new Set('text-embedding-ada-002');

export const embedWithoutDimensions = (model: string) => embedModelsWithoutDimensions.has(model);
