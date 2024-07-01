import 'reflect-metadata';
import Meta from '../meta';
import typia from 'typia';

function decorateArgument( type: string, name: string | undefined, target: Object, propertyKey: string | symbol, parameterIndex: number )
{
    Meta.pushProperty( 'routeArguments', target, propertyKey, { index: parameterIndex, type, name });
    Meta.getProperty<{index: number}[]>( 'routeArguments', target, propertyKey ).sort(( a, b ) => a.index - b.index );
}

const argumentDecorator = ( type: string ) => decorateArgument.bind( null, type, undefined );
const namedArgumentDecorator = ( type: string ) => ( name: string ) => decorateArgument.bind( null, type, name );

export const Path       = argumentDecorator('PATH');
export const Param      = namedArgumentDecorator('PARAM');
export const Header     = namedArgumentDecorator('HEADER');
export const Body       = argumentDecorator('BODY');
//export const Query      = namedArgumentDecorator('QUERY');
export const Headers    = argumentDecorator('HEADERS');
export const Request    = argumentDecorator('REQUEST');
export const Response   = argumentDecorator('RESPONSE');

export function Query<T>( name: string )
{
    const validator = typia.createValidate<{ foo: string }>();

    console.log( validator );

    return ( target: Object, propertyKey: string | symbol, parameterIndex: number ) =>
    {
        decorateArgument( 'QUERY', name, target, propertyKey, parameterIndex );
    }
};