import { createServer, Server } from 'http';
import Meta from './meta';

import { RouteMetadata } from './types/private';
import { QueryParser } from './helpers/parsers';
import Router, { EndpointRequest, EndpointResponse } from './router';
import { HTML } from './helpers/todo';
import { EndpointCreateOptions } from './types/public';

export * from './helpers/todo';
export * from './decorators';

export { EndpointRequest, EndpointResponse };

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

        console.log( 'TUTAJ', options.controllers[0], Meta.get( 'cors', options.controllers[0] ));
        //console.log( 'TUTAJ', Meta.get( 'cors', options.controllers[0].constructor.prototype['stranka'] ) );

        for( const { Controller, routes } of controllers )
        {
            for( const { method, path, fn, args } of routes )
            {
                //console.log({ method, path, fn, meta: Meta.get( 'cors', Controller[method] ) });

                this.router.listen([ method ], [ path ], [ async( request, response ) =>
                {
                    // TODO cors
                    
                    try
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

            response.setHeader( 'Access-Control-Allow-Origin', '*' );
            response.setHeader( 'Access-Control-Allow-Methods', '*' );
            response.setHeader( 'Access-Control-Allow-Headers', '*' );

            if( request.method === 'OPTIONS' )
            {
                response.end();
            }
            else
            {
                this.router.dispatch( request as EndpointRequest, response as EndpointResponse );
            }
        });

        this.server.listen( options.port );
    }
}