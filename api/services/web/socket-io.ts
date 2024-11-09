import * as cache from 'memory-cache';
import { Server } from 'socket.io';
// import apiIO from '../../io/io';
import { IWebApp } from '../../@types/web';

export default (webApp: IWebApp, corsOptions: any) => {
  const io = new Server(webApp.server, { cors: corsOptions });
  // apiIO(io);
  cache.put('io', io);
  return io;
};
