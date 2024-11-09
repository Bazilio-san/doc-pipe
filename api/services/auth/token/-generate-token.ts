import { intEnv, strEnv } from 'af-tools-ts';
import { generateToken } from './token-core';

const token = generateToken(strEnv('GT_USER', 'vvmakarov'), intEnv('GT_LIVE_TIME', 300));
// eslint-disable-next-line no-console
console.log(token);
