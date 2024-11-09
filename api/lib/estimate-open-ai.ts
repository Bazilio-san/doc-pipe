import { rn } from 'af-tools-ts';
import { promptTokensEstimate } from 'openai-chat-tokens';
import { Message } from '../@types/i-openai';
import { getPriceForModelUSD } from '../models/models-list';

export const getBytesLen = (s: string): number => {
  let length: number = 0;
  try {
    ({ length = 0 } = Buffer.from(s));
  } catch (err) {
    //
  }
  return length;
};

export const getBytesLengthOfString = (s: string) => {
  let length = getBytesLen(s);
  if (length / 1024 < 1) {
    return `${length}`;
  }
  length /= 1024;
  if (length / 1024 < 1) {
    return `${rn(length, 1)}K`;
  }
  length /= 1024;
  return `${rn(length, 1)}M`;
};

export const countWords = (v: any): number => {
  v = String(v || '').trim();
  return v ? v.split(/\s+/s).length : 0;
};

export const estimateTokens = (content: string) => promptTokensEstimate({
  messages: [
    { role: 'system', content },
  ],
});

export const estimateTokensAndPriceUSD = (model: string, messages: Message[], isFromGpt?: boolean): {
  tokens: number,
  price: number
} => {
  const tokens = promptTokensEstimate({ messages });
  // Цена в $
  const price = getPriceForModelUSD({ model, [isFromGpt ? 'outTokens' : 'inTokens']: tokens });
  return { tokens, price };
};
