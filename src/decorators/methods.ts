import Meta from '../meta';
import { RouteMetadata } from '../types/private';
import { assert, validate } from 'typia';

function decorateMethod( method: RouteMetadata['method'], path: string )
{
    return function( target: any, property: string, descriptor: PropertyDescriptor )
    {
        const argMetas = Meta.getProperty<RouteMetadata['args']>( 'routeArguments', target, property );
        const argTypes = Reflect.getMetadata( 'design:paramtypes', target, property );

        /*argTypes.forEach((type: any, index: number) => 
        {
            
                console.log(`Parameter[${index}]:`);
                console.log(`  Name: ${type.name}`);
                console.log(`  Prototype: ${type.prototype}`);
                console.log(`  Length: ${type.length}`);
                console.log(`  Full Type: ${type}`);

                console.log( validate<{ [key: string]: typeof type.prototype }>({ 'param1':  2 }) );
            
        });

        const argType = Reflect.getMetadata( 'design:type', argTypes[0].constructor );

        console.log({ argMetas, argTypes, argType });*/

        Meta.push<RouteMetadata>( 'routes', target.constructor, { method, path, fn: property, args: argMetas });

        /*validate = typia.createValidate<IBbsArticle>();
        
        const handler = descriptor.value;

        descriptor.value = function( ...args: any[] )
        {
            console.log({ args, argMetas, argTypes });

            for( let i = 0; i < argMetas.length; i++ )
            {
                let x = validate<{foo: 'string'}>( args[0] );

                console.log( x, args[0] );
            }

            return handler.apply( this, args );
        };

        return descriptor;*/
    }
}

const methodDecorator = ( type: RouteMetadata['method'] ) => decorateMethod.bind( null, type );

export const Get    = methodDecorator('GET');
export const Post   = methodDecorator('POST');
export const Put    = methodDecorator('PUT');
export const Patch  = methodDecorator('PATCH');
export const Delete = methodDecorator('DELETE');