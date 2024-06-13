import { Post, Get, Path, getRoutes } from './decorators';

class Controller
{
    @Post( '/foo/:id' )
    postMetodka
    (
        @Path('id') id: string,
        @Path('id2') id2: string
    )
    {
        console.log( 'Post metodka' );
    }

    @Get( '/foo/:id' )
    getMetodka
    (
        @Path('id') id: string,
        @Path('id2') id2: string
    )
    {
        console.log( 'Get metodka' );
    }
}

console.log('Registered Routes:', getRoutes(Controller));

const controller = new Controller();


//controller.postMetodka( 'test', 'test' );