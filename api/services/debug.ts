import { Debug } from 'af-tools-ts';
import { bold, reset, yellow, magenta } from 'af-color';

export const debugJbApiAuth = Debug('doc-pipe-api:auth', {
  noTime: true,
  noPrefix: false,
  prefixColor: bold + yellow,
  messageColor: reset,
});

export const debugFetch = Debug('fetch', {
  noTime: true,
  noPrefix: false,
  prefixColor: bold + yellow,
  messageColor: reset,
});

export const debugBotApi = Debug('doc-pipe-api', {
  noTime: true,
  noPrefix: false,
  prefixColor: bold + magenta,
  messageColor: reset,
});

export const debugSql = Debug('sql', {
  noTime: true,
  noPrefix: false,
  prefixColor: bold + magenta,
  messageColor: reset,
});

export const debugWebHealth = Debug('web:health', {
  noTime: true,
  noPrefix: false,
  prefixColor: bold + magenta,
  messageColor: reset,
});

export const debugWebAll = Debug('web:all', {
  noTime: true,
  noPrefix: false,
  prefixColor: bold + magenta,
  messageColor: reset,
});
