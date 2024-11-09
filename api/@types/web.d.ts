import { Express } from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';
import { Socket } from 'socket.io';
import { INotifyConfig } from '../io/io-lib/io-spa-notify';
import { ISess } from '../services/auth/session/i-session';
import { ICommonResult } from './i-common';

export interface IWebApp {
  app: Express;
  server: http.Server
}

declare module 'socket.io' {
  interface Socket {
    applyFn: (...args: any[]) => void,
    resultOrError: (args: any[], res: ICommonResult, errorAndResult?: boolean) => void,

    SPA: (arg: string | INotifyConfig, type?: string, timeout?: number) => void,
    SPAerr: (arg: string | INotifyConfig, timeout?: number) => void,
    SPAwarn: (arg: string | INotifyConfig, timeout?: number) => void,
    SPAinfo: (arg: string | INotifyConfig, timeout?: number) => void,

    // Пересылка сообщений в консоль браузера
    error: (...args: any[]) => void,
    warn: (...args: any[]) => void,
    info: (...args: any[]) => void,
    debug: (...args: any[]) => void,
    silly: (...args: any[]) => void,

    checkRights: (right: string) => Promise<boolean>;
    checkRightsAndAlert: (right: string) => Promise<boolean>;
    // eslint-disable-next-line no-undef
    session: ISess,
    user: string, // <-- socket.session.uiUser.username
    authUser: string, // <-- socket.session.data.authUser.username
    lng: string, // <-- socket.session.lng
    /**
     * = socket.handshake.headers["x-real-ip"]
     * | socket.handshake.headers["x-forwarded-for"]
     * | socket.handshake.address
     */
    clientIp: string,
    //   | socket.handshake.headers["x-forwarded-for"]
  }
}

export interface ISocketOptions {
  socket: Socket,
  io: socketIo.Server
}

declare global {
  namespace Express {
    export interface Request {
      requestSource?: string,
    }
  }
}
