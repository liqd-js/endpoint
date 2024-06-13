import Meta from '../meta';

function decorateMethod( method: string, url: string )
{
    return function( target: any, propertyName: string, descriptor: PropertyDescriptor )
    {
        Meta.push( 'routes', target.constructor, { method, url, propertyName });

        const handler = descriptor.value;

        descriptor.value = function( ...args: any[] )
        {
            const parameterTypes: any[] = Meta.getProperty( 'parameterTypes', target, propertyName ) || [];

            for( const param of parameterTypes )
            {
                console.log( param );

                const paramValue = args[param.index];
                if (typeof paramValue !== 'string') {
                throw new Error(`Invalid type for parameter ${param.name}. Expected string, got ${typeof paramValue}`);
                }
            }

            console.log(`${method} request to URL: ${url}`);
            return handler.apply( this, args );
        };

        return descriptor;
    }
}

export function Get     ( url: string ){ return decorateMethod( 'GET'      , url )}
export function Post    ( url: string ){ return decorateMethod( 'POST'     , url )}
export function Put     ( url: string ){ return decorateMethod( 'PUT'      , url )}
export function Patch   ( url: string ){ return decorateMethod( 'PATCH'    , url )}
export function Delete  ( url: string ){ return decorateMethod( 'DELETE'   , url )}