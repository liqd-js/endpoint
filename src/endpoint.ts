import { createServer, Server } from 'http';
import Meta from './meta';

import { RouteMetadata } from './types/private';
import { CookieParser, QueryParser } from './helpers/parsers';
import Router, { EndpointRequest, EndpointResponse } from './router';
import { HTML } from './helpers/todo';
import { EndpointCreateOptions, Middleware } from './types/public';
import { ServerError } from './errors';

export * from './helpers/todo';
export * from './decorators';
export * from './errors';

export * from './types/public';

export default class Endpoint
{
    private server: Server;
    private router = new Router();

    static create( options: EndpointCreateOptions )
    {
        return new Endpoint( options );
    }

    private async handleRequest( request: EndpointRequest, response: EndpointResponse, middlewares: Middleware[] = [] )
    {
        for( let i = 0; i < middlewares.length; ++i )
        {
            const middleware = middlewares[i];

            if( Object.getPrototypeOf( middleware ).hasOwnProperty('useCallback'))
            {
                return await new Promise<void>(( resolve, reject ) => middleware.useCallback( request, response, async( error ) =>
                {
                    if( error ){ return reject( error )}

                    try
                    {
                        await this.handleRequest( request, response, middlewares.slice( i + 1 ));

                        resolve();
                    }
                    catch( e: any )
                    {
                        reject( e );
                    }
                }));
            }
            else
            {
                await middleware.use( request, response );
            }
        }
        
        await this.router.dispatch( request as EndpointRequest, response as EndpointResponse );
    }

    private constructor( options: EndpointCreateOptions )
    {
        const controllers = options.controllers.map( Controller => ({ Controller: Controller as any, routes: ( Meta.get( 'routes', Controller ) ?? []) as RouteMetadata[]}));

        for( const { Controller, routes } of controllers )
        {
            for( const { method, path, fn, args } of routes )
            {
                //console.log({ method, path, fn, meta: Meta.get( 'cors', Controller[method] ) });

                this.router.listen( method, path, async( request, response ) =>
                {
                    const controller = new Controller();
                    const result = await controller[fn]( ...( await Promise.all(( args ?? [] ).map( a => a.resolver( a, request, response )))));

                    if( !result )
                    {

                    }
                    else if( result === response )
                    {
                        return;
                    }
                    else if( result instanceof HTML )
                    {
                        response.setHeader( 'Content-Type', 'text/html' );
                        response.write( result.toString() );
                    }
                    else if( typeof result !== 'string' )
                    {
                        response.setHeader( 'Content-Type', 'application/json' );
                        response.write( JSON.stringify( result ));
                    }
                    else
                    {
                        response.setHeader( 'Content-Type', 'text/plain' );
                        response.write( result );
                    }
                    
                    response.end();
                });
            }
        }

        this.server = createServer( async( request, response ) =>
        {
            let query: any, cookies: Record<string, string>;
            
            Object.assign( request, { path: request.url?.split('?')[0] });
            Object.assign( request, { params: {}});
            Object.defineProperty( request, 'query', { get: () => query ?? ( query = QueryParser.parse( request.url?.split('?')[1] ?? '' )) });
            Object.defineProperty( request, 'cookies', { get: () => cookies ?? ( cookies = CookieParser.parse( request.headers.cookie ?? '' )) });

            response.setHeader( 'Access-Control-Allow-Origin', request.headers.referer?.match( /^https?:\/\/[^/]+/ )?.[0] || '*' );
            response.setHeader( 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS' );
            //response.setHeader( 'Access-Control-Allow-Headers', '*' );
            response.setHeader( 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With' );
            request.headers.referer?.match( /^https?:\/\/[^/]+/ )?.[0] && response.setHeader( 'Access-Control-Allow-Credentials', 'true' );

            if( request.method === 'OPTIONS' )
            {
                response.end();
            }
            else
            {
                try
                {
                    await this.handleRequest( request as EndpointRequest, response as EndpointResponse, options.middlewares );
                }
                catch( e: any )
                {
                    response.statusCode = e.code || 500;
                    response.statusMessage = e.message || 'Internal Server Error';
                    response.end( e instanceof ServerError && e.data ? JSON.stringify( e.data, null, '  ' ) : undefined );
                }
            }
        });

        this.server.listen( typeof options.port === 'string' ? parseInt( options.port ) : options.port );
    }
}