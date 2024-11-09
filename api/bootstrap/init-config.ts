import './dotenv';
import configModule from 'config';
import { IConfig } from '../@types/config';

export const config: IConfig = configModule.util.toObject();
