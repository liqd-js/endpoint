import { Body, Get, Header, Param, Path, Post, Query, Headers } from '../decorators';

type TypedQuery = { foo: string };

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


    @Get( '/foo2/:id' )
    query
    (
        @Query('foo') q: TypedQuery,
        @Query('bar') b: string
    )
    {
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