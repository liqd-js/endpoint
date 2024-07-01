import { createServer, Server } from 'http';
import Meta from './meta';

import TestController from './controllers/test';
import { RouteMetadata } from './types/private';
import Router, { Request, Response } from './router';

export * from './decorators';

export function getRoutes( controller: any ): RouteMetadata[]
{
    return Meta.get( 'routes', controller ) ?? [];
}

export type EndpointCreateOptions =
{
    controllers : any[],
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
        const controllers = options.controllers.map( Controller => ({ Controller, routes: getRoutes( Controller )}));

        console.log( controllers );

        for( const { Controller, routes } of controllers )
        {
            for( const { method, path, fn, args } of routes )
            {
                this.router.listen([ method ], [ path ], [ async( request, response ) =>
                {
                    const controller = new Controller();

                    const result = await controller[fn]( ...args.map( a => a.type === 'PATH' ? request.url : 'string' ) );

                    response.write(result);
                    response.end();
                }]);
            }
        }

        this.server = createServer( async( request, response ) =>
        {
            Object.assign( request, { path: request.url?.split('?')[0] });
            Object.assign( request, { params: {}});

            this.router.dispatch( request as Request, response as Response );   
        });

        this.server.listen( options.port );
    }
}

Endpoint.create({ controllers: [ TestController ], port: 8080 });