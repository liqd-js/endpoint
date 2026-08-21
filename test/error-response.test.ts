import assert from 'node:assert/strict';
import { request } from 'node:http';
import { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'mocha';
import Endpoint, { Controller, Get, ServerError } from '../src/endpoint';

class ErrorResponseController extends Controller
{
    @Get( '/error' ) public error()
    {
        throw new Error( 'template failed\non another line' );
    }

    @Get( '/healthy' ) public healthy()
    {
        return 'healthy';
    }

    @Get( '/not-found' ) public notFound()
    {
        throw new ServerError( 404, 'internal details must not become a status message' );
    }
}

function get( port: number, path: string )
{
    return new Promise<{ statusCode?: number, statusMessage?: string, body: string }>(( resolve, reject ) =>
    {
        const req = request({ port, path, agent: false }, response =>
        {
            let body = '';
            response.setEncoding( 'utf8' );
            response.on( 'data', chunk => body += chunk );
            response.on( 'end', () => resolve({ statusCode: response.statusCode, statusMessage: response.statusMessage, body }));
        });

        req.on( 'error', reject );
        req.setTimeout( 1000, () => req.destroy( new Error( `Timed out waiting for ${path}` )));
        req.end();
    });
}

describe( 'uncaught HTTP errors', () =>
{
    const endpoint = Endpoint.create({ controllers: [ ErrorResponseController ], port: 0 });
    const server = ( endpoint as any ).server;
    let port: number;

    before( async() =>
    {
        await new Promise<void>( resolve => server.listening ? resolve() : server.once( 'listening', resolve ));
        port = ( server.address() as AddressInfo ).port;
    });

    after( async() =>
    {
        server.closeAllConnections?.();
        await new Promise<void>(( resolve, reject ) => server.close( ( error?: Error ) => error ? reject( error ) : resolve() ));
    });

    it( 'returns a generic 500 for a multiline error and keeps serving requests', async() =>
    {
        const failed = await get( port, '/error' );

        assert.equal( failed.statusCode, 500 );
        assert.equal( failed.statusMessage, 'Internal Server Error' );

        const healthy = await get( port, '/healthy' );

        assert.equal( healthy.statusCode, 200 );
        assert.equal( healthy.body, 'healthy' );

        const notFound = await get( port, '/not-found' );

        assert.equal( notFound.statusCode, 404 );
        assert.equal( notFound.statusMessage, 'Not Found' );
    });
});
