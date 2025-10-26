import { createServer, Server } from 'http';
import Meta from './meta';

import { RouteMetadata } from './types/private';
import { CookieParser, QueryParser } from './helpers/parsers';
import Router, { EndpointRequest, EndpointResponse } from './router';
import { HTML } from './helpers/todo';
import { Controller, EndpointCreateOptions, Middleware } from './types/public';
import { ServerError } from './errors';

const WebSocket = require('@liqd-js/websocket');

export * from './helpers/todo';
export * from './decorators';
export * from './errors';
export * from './types/public';

export default class Endpoint
{
    private server: Server;
    private wsServer: any; // TODO WebSocket.Server;
    private router = new Router();

    static create( options: EndpointCreateOptions )
    {
        return new Endpoint( options );
    }

    private async handleHTTPRequest( request: EndpointRequest, response: EndpointResponse, middlewares: Middleware[] = [] )
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
                        await this.handleHTTPRequest( request, response, middlewares.slice( i + 1 ));

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
        
        await this.router.dispatchHTTP( request as EndpointRequest, response as EndpointResponse );
    }

    private constructor( options: EndpointCreateOptions )
    {
        this.server = this.createServer( options );

        const controllers = options.controllers.map( Controller => ({ Controller: Controller as any, routes: ( Meta.get( 'routes', Controller ) ?? []) as RouteMetadata[]}));

        for( const { Controller, routes } of controllers )
        {
            const controller = new Controller();

            for( const route of routes )
            {
                if( route.method === 'WS' )
                {
                    //this.listenWS( controller, route );
                }
                else
                {
                    this.listenHTTP( controller, route );
                }

                //console.log({ method, path, fn, meta: Meta.get( 'cors', Controller[method] ) });
            }
        }

        this.server.listen( typeof options.port === 'string' ? parseInt( options.port ) : options.port );
    }

    private createServer( options: EndpointCreateOptions ): Server
    {
        return createServer( async( request, response ) =>
        {
            let query: any, cookies: Record<string, string>;
            
            Object.assign( request, { hostname: request.headers.host?.replace( /:\d+$/, '' ) || '' });
            Object.assign( request, { url: request.url || '' });
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
                    await this.handleHTTPRequest( request as EndpointRequest, response as EndpointResponse, options.middlewares );
                }
                catch( e: any )
                {
                    response.statusCode = e.code || 500;
                    response.statusMessage = e.message || 'Internal Server Error';
                    response.end( e instanceof ServerError && e.data ? JSON.stringify( e.data, null, '  ' ) : undefined );
                }
            }
        });
    }

    private createWSServer( options: EndpointCreateOptions ): any // TODO WebSocket.Server
    {
        if( !this.wsServer )
        {
            this.wsServer = new WebSocket.Server(
            {
                server: this.server,
                //...this.#options?.ws,
                client:                 // TODO lepsie
                {
                    accept: async( request: EndpointRequest, socket: any ) =>
                    {


                        /*

                        if( true )// !this.#options?.ws?.client?.accept || await this.#options.ws.client.accept( request, socket ))
                        {
                            return this.#ws_router.handles( request );
                        }

                        return false;*/
                    }
                }
            });
        }
    }

    private listenHTTP( controller: Controller, route: RouteMetadata )
    {
        const { method, path, fn, args } = route;

        this.router.listen( method, path, async( request, response ) =>
        {
            const result = await ( controller as any )[fn]( ...( await Promise.all(( args ?? [] ).map( a => a.resolver( a, request, response )))));

            if( !result )
            {
            
            }
            else if( result === response )
            {
                return;
            }
            else if( result instanceof HTML )
            {
                response.setHeader( 'Content-Type', 'text/html; charset=utf-8' );
                response.write( result.toString() );
            }
            else if( typeof result !== 'string' )
            {
                response.setHeader( 'Content-Type', 'application/json; charset=utf-8' );
                response.write( JSON.stringify( result ));
            }
            else
            {
                response.setHeader( 'Content-Type', 'text/plain; charset=utf-8' );
                response.write( result );
            }
            
            response.end();
        });
    }

    /*private listenWS( controller: Controller, route: RouteMetadata )
    {
        const { path, fn, args } = route;

        this.createWSServer( { controllers: [], middlewares: [] });

        this.wsServer.on( 'connection', async( socket: any, request: EndpointRequest ) =>
        {
            request.params = {};

            if( path instanceof RegExp )
            {
                const match = path.exec( request.url ?? '' );
                if( match ){ request.params = match.groups ?? {} }
            }

            const result = await ( controller as any )[fn]( ...( await Promise.all(( args ?? [] ).map( a => a.resolver( a, request, socket )))));

            if( !result ){ return }

            if( typeof result === 'string' )
            {
                socket.send( result );
            }
            else
            {
                socket.send( JSON.stringify( result ));
            }
        });
    }*/
}