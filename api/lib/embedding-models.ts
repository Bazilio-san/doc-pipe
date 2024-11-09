// Цены указаны за 1млн токенов https://openai.com/api/pricing/
import { EmbeddingCreateParams } from 'openai/src/resources/embeddings';

interface IEmbModelInfo {
  contextSize: number,
  inPrice: number,
  outPrice: number,
  inBPrice: number,
  outBPrice: number,
  dimensions: number[],
  dimensionsAllowed: boolean,
}

class EmbeddingCreateParamsError extends Error {
  constructor (message: string) {
    super(message);
    this.name = 'EmbeddingCreateParamsError';
  }
}

const openAiEmbeddingModelsData: { [model: string]: IEmbModelInfo } = {
  'text-embedding-3-small': {
    contextSize: 8.191,
    inPrice: 0.02,
    outPrice: 0.02,
    inBPrice: 0.01,
    outBPrice: 0.01,
    dimensions: [512, 1536],
    dimensionsAllowed: true,
  },
  'text-embedding-3-large': {
    contextSize: 8.191,
    inPrice: 0.13,
    outPrice: 0.13,
    inBPrice: 0.065,
    outBPrice: 0.065,
    dimensions: [256, 1024, 1536, 3072],
    dimensionsAllowed: true,
  },
  'text-embedding-ada-002': {
    contextSize: 8.191,
    inPrice: 0.1,
    outPrice: 0.1,
    inBPrice: 0.05,
    outBPrice: 0.05,
    dimensions: [1536],
    dimensionsAllowed: false,
  },
};

export const openAiEmbeddingModelsDataArr: [string, number, number, number, number?, number?][] = Object.entries(openAiEmbeddingModelsData).map(
  ([model, v]) => [model, v.contextSize, v.inPrice, v.outPrice, v.inBPrice, v.outBPrice],
);

const allowedProps = new Set(['input', 'model', 'dimensions', 'encoding_format', 'user']);

export const validateApiParamsForModel = (params: EmbeddingCreateParams) => {
  const info = openAiEmbeddingModelsData[params.model];
  if (!info) {
    throw new EmbeddingCreateParamsError(`Unknown embedding model: "${params.model}"`);
  }
  if (typeof params.input === 'string' && !params.input.trim()) {
    throw new EmbeddingCreateParamsError(`Empty text sent to receive embeddings`);
  }
  if (!Array.isArray(params.input)) {
    throw new EmbeddingCreateParamsError(`Property 'input' is neither a string nor an array of strings`);
  }
  params.input.forEach((txt, index) => {
    if (typeof txt !== 'string') {
      throw new EmbeddingCreateParamsError(`In the 'input' array passed value of type "${typeof txt}" (index = ${index})`);
    }
    if (!String(txt || '').trim()) {
      throw new EmbeddingCreateParamsError(`Empty text is passed as part of the 'input' array (index = ${index})`);
    }
  });

  if (!info.dimensionsAllowed) {
    delete params.dimensions;
  } else if (!info.dimensions.includes(params.dimensions || 0)) {
    throw new EmbeddingCreateParamsError(`Dimensions ${params.dimensions} are not applicable to the model "${params.model}"`);
  }

  Object.getOwnPropertyNames(params).forEach((name: string) => {
    if (!allowedProps.has(name)) {
      // @ts-ignore
      delete params[name];
    }
  });
};
