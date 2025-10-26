import type { IncomingMessage, ServerResponse } from 'http';
import { NotFoundError } from './errors';

// TODO zistit preco nejde '/avatars/:id/:size([0-9]*x[0-9]*).jpg'

const HTTP_METHODS = new Set([ 'HEAD', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE' ]);
const PATH_REPEAT_RE = /(?<!\))\*/g;
const PATH_DOT_RE = /\./g;
const PATH_PARAM_WH_DEF_RE = /:([a-zA-Z_]+)\((([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(\))+\))+\))+\))+\))+\))+\))+\))+)\)/g; // ([^(]|\\((?R)\\))+
const PATH_PARAM_WO_DEF_RE = /:([a-zA-Z_]+)/g;

export type EndpointRequest = IncomingMessage & { domain: string, url: string, path: string, params: Object, query: any, body: Object, cookies: Record<string, string> };
export type EndpointResponse = ServerResponse<IncomingMessage> & { req: EndpointRequest };
export type RouterMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'CONNECT' | 'TRACE' | 'WS';
export type RouterPath = string | RegExp;
export type RouterNext = ( route?: 'route' | 'error' ) => void;
export type RouterHandler = ( req: EndpointRequest, res: EndpointResponse ) => Promise<void> | void;

const isExactPath = ( path: string | RegExp ) => !( path instanceof RegExp || /[:*]/.test( path ));
const pathToRegExp = ( path: string | RegExp ) =>
{
    if( path instanceof RegExp ){ return path }
        
    return new RegExp
    (   '^' + 
        path
            .replace( PATH_DOT_RE,          '\\.' )
            .replace( PATH_REPEAT_RE,       '.*' )
            .replace( PATH_PARAM_WH_DEF_RE, '(?<$1>$2)' )
            .replace( PATH_PARAM_WO_DEF_RE, '(?<$1>[^\\/]+)' )
        + '$',
        '' 
    );
}

export default class Router
{
    private routes = new Array<{ method: RouterMethod, path: string | RegExp, handler: RouterHandler }>();

    public seo()
    {
        
    }

    public cors( method: RouterMethod, path: RouterPath )
    {
        //this.routes.push({ methods, paths: paths.map( this.pathToRegExp )});
    }

    public listen( method: RouterMethod, path: RouterPath, handler: RouterHandler )
    {
        this.routes.push({ method, path: isExactPath( path ) ? path : pathToRegExp( path ), handler });
    }

    public route( method: RouterMethod, path: string )
    {
        return this.routes.find( route => 
            route.method === method && 
            ( typeof route.path === 'string' ? route.path === path : route.path instanceof RegExp && route.path.test( path ))
        );
    }

    private dispatch( method: RouterMethod, req: EndpointRequest ): RouterHandler
    {
        const route = this.route( method, req.path );

        if( !route ){ throw new NotFoundError() }
        

        if( route.path instanceof RegExp )
        {
            req.params = route.path.exec( req.path )?.groups ?? {};
        }

        return route.handler;
    }

    public async dispatchHTTP( req: EndpointRequest, res: EndpointResponse )
    {
        return await this.dispatch( req.method as RouterMethod, req )( req, res );
    }

    public async dispatchWebsocket( req: EndpointRequest, res: EndpointResponse )
    {
        return await this.dispatch( 'WS', req )( req, res );
    }
}