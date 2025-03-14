import type { IncomingMessage, ServerResponse } from 'http';
import { NotFoundError } from './errors';

// TODO zistit preco nejde '/avatars/:id/:size([0-9]*x[0-9]*).jpg'

const HTTP_METHODS = new Set([ 'HEAD', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE' ]);
const PATH_REPEAT_RE = /(?<!\))\*/g;
const PATH_DOT_RE = /\./g;
const PATH_PARAM_WH_DEF_RE = /:([a-zA-Z_]+)\((([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(\))+\))+\))+\))+\))+\))+\))+\))+)\)/g; // ([^(]|\\((?R)\\))+
const PATH_PARAM_WO_DEF_RE = /:([a-zA-Z_]+)/g;

export type EndpointRequest = IncomingMessage & { url: string, path: string, params: Object, query: any, body: Object, cookies: Record<string, string> };
export type EndpointResponse = ServerResponse<IncomingMessage> & { req: EndpointRequest };
export type RouterMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'CONNECT' | 'TRACE';
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

    public async dispatch( req: EndpointRequest, res: EndpointResponse )
    {
        for( let route of this.routes )
        {
            if( route.method === req.method )
            {
                if( typeof route.path === 'string' && route.path !== req.path ){ continue }
                
                if( route.path instanceof RegExp )
                {
                    let match = route.path.exec( req.path );

                    if( !match ){ continue }
                    
                    req.params = match.groups || {};
                }

                return await route.handler( req, res );
            }
        }

        throw new NotFoundError();
    }
}