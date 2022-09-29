import Route from './src/utils/Route'
import * as express from 'hyper-express';

export type Methods = 'ws' | 'WS' | 'upgrade' | 'UPGRADE' | 'all' | 'ALL' | 'get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | 'purge' | 'PURGE' | ('get' | 'GET' | 'delete' | 'DELETE' | 'head' | 'HEAD' | 'options' | 'OPTIONS' | 'post' | 'POST' | 'put' | 'PUT' | 'patch' | 'PATCH' | 'purge' | 'PURGE' | 'all' | 'ALL' | 'ws' | 'WS' | 'upgrade' | 'UPGRADE')[]

export type Run = (req: express.Request, res: express.Response, app: express.Server) => void

export type RouteItem = {
    path: string;
    route: string;
    regex: RegExp;
    method: Methods;
    run: RunCallBack;
    middleware: RunCallBack[] | function[];
    Route: Route;
}