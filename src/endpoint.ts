import { createServer, Server } from 'http';
import Meta from './meta';

import { RouteMetadata } from './types/private';
import { QueryParser } from './helpers/parsers';
import Router, { EndpointRequest, EndpointResponse } from './router';
import { HTML } from './helpers/todo';

export * from './helpers/todo';
export * from './decorators';

export { EndpointRequest, EndpointResponse };

export class Controller
{
    public constructor()
    {

    }
};

export type EndpointCreateOptions =
{
    controllers : Controller[],
    port        : number
}

export default class Endpoint
{
    private server: Server;
    private router = new Router();

    static create( options: EndpointCreateOptions )
    {
        return new Endpoint( options );
    }

    private constructor( options: EndpointCreateOptions )
    {
        const controllers = options.controllers.map( Controller => ({ Controller: Controller as any, routes: ( Meta.get( 'routes', Controller ) ?? []) as RouteMetadata[]}));

        for( const { Controller, routes } of controllers )
        {
            for( const { method, path, fn, args } of routes )
            {
                this.router.listen([ method ], [ path ], [ async( request, response ) =>
                {
                    try
                    {
                        const controller = new Controller();
                        const result = await controller[fn]( ...( args ?? [] ).map( a => a.resolver( a, request, response )));

                        if( result instanceof HTML )
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
                    }
                    catch( e )
                    {
                        console.error( e );
                        throw e;
                    }
                }]);
            }
        }

        this.server = createServer( async( request, response ) =>
        {
            let query: any;
            
            Object.assign( request, { path: request.url?.split('?')[0] });
            Object.assign( request, { params: {}});
            Object.defineProperty( request, 'query', { get: () => query ?? ( query = QueryParser.parse( request.url?.split('?')[1] ?? '' )) });

            this.router.dispatch( request as EndpointRequest, response as EndpointResponse );   
        });

        this.server.listen( options.port );
    }
}