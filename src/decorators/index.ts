import Meta from '../meta';

export * from './methods';

export function Path( name: string )
{
    return function( target: Object, propertyKey: string | symbol, parameterIndex: number )
    {
        Meta.pushProperty( 'parameterTypes', target, propertyKey, { index: parameterIndex, name: name });
    };
}

export function getRoutes(controller: any): { method: string, url: string, propertyName: string }[]
{
    return Meta.get( 'routes', controller ) ?? [];
}