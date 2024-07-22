import Meta from '../meta';
import { RouteMetadata } from '../types/private';
import { CorsOptions } from '../types/public';

function decorateRoute( cors: CorsOptions )
{
    return function( target: any, property: string, descriptor: PropertyDescriptor )
    {
        Meta.push<{ fn: string, cors: CorsOptions }>( 'cors', target.constructor, { fn: property, cors });
        //Meta.push<RouteMetadata>( 'routes', target.constructor, { method, path, fn: property, args: argMetas });
    }
}

//const methodDecorator = ( type: RouteMetadata['method'] ) => decorateMethod.bind( null, type );

export const Cors   = decorateRoute;