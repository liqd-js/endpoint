import { Body, Get, Header, Param, Path, Post, Query, Headers, Controller, Url, Domain, Params, Request, Response, HTML } from '../../src/endpoint';
import { EndpointRequest, EndpointResponse } from '../../src/router';

type TypedQuery = { foo: string };

//@Controller()
export default class TestController
{
   /* @Get( '/foo/:id' )
    getMetodka
    (
        @Path path: string,
        @Param('id') id: string,
        @Param('id2') id2: string,
        @Query('foo') q: string,
        @Body  q2: string,
        @Header('jozo') h: string,
        @Headers h2: string
    )
    {
        console.log( 'Get metodka' );

        return `Hello world z Getu ${path} ${Date.now()}`;
    }*/

    @Get( '/product' ) stranka(): HTML
    {
        return new HTML(`<h1>PRD MAKOVY ${Date.now()}</h1><textarea></textarea>`);
    }

    @Get( '/product/list' )
    list
    (
        @Url url: string,
        @Domain domain: string,
        @Headers headers: any,
        @Params params: any,
        @Request request: EndpointRequest,
        @Response response: EndpointResponse
    )
    {
        console.log( response );

        response.write('PRD MAKOVY');

        return [{ foo: 'bar' }];
    }


    @Get( '/product/:id([0-9]+)' )
    //@Internal() accessible only tru redirect/seo
    query
    (
        @Url            url     : string,
        @Domain         domain  : string,
        @Headers        headers : any,
        @Header('user-agent') agent : string,
        @Path           path    : string,
        @Params         params  : any,
        @Param('id')    param   : string,
        @Query('')      query   : TypedQuery,
        @Query('foo')   foo     : TypedQuery,
        @Query('bar')   bar     : string,
        @Body           body    : string
    )
    {
        foo.foo = 'barko';

        console.log( 'tu sme', { url, domain, agent, headers, path, params, param, query, foo, bar, body });

        return `Hello world z Getu ${Date.now()}`;
    }
    
    /*@Post( '/foo/:id' )
    postMetodka
    (
        @Param('id') id: string,
        @Param('id2') id2: string
    )
    {
        console.log( 'Post metodka' );
    }*/
}