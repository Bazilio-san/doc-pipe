import OpenAI from 'openai';
import * as CompletionsAPI from 'openai/src/resources/completions';

export type Message = OpenAI.Chat.ChatCompletionMessageParam;
export type CompletionUsage = CompletionsAPI.CompletionUsage;
