import 'reflect-metadata';
import Meta from '../meta';
import { EndpointRequest, EndpointResponse } from '../router';
import { RouteArgResolver, RouteArgType } from '../types/private';
import { IPParser } from '../helpers/parsers';

const HttpBodyParser = require('@liqd-js/http-body-parser');
//import typia from 'typia';

const RESOLVERS: Record<RouteArgType, RouteArgResolver> =
{
    REQUEST     : ( arg, request ) => request,
    RESPONSE    : ( arg, request, response ) => response,
    HEADERS     : ( arg, request ) => request.headers,
    HEADER      : ( arg, request ) => request.headers[arg.name.toLowerCase()],
    IP          : ( arg, request ) => IPParser.parse( request ),
    URL         : ( arg, request ) => request.headers.host! + request.url!,
    DOMAIN      : ( arg, request ) => request.headers.host?.replace( /:\d+$/, '' ),
    PATH        : ( arg, request ) => request.path,
    PARAMS      : ( arg, request ) => request.params,
    //@ts-ignore
    PARAM       : ( arg, request ) => request.params[arg.name],
    QUERY       : ( arg, request ) => arg.name ? request.query[arg.name] : request.query,
    BODY        : ( arg, request ) => 
    {
        return new Promise( resolve =>
        {
            const body = new HttpBodyParser( request.headers['content-type'] );

            request.pipe( body );

            body.on( 'data', ( data: any ) => resolve( data ));
        });
    },
    RAW_BODY        : ( arg, request ) =>  
    {
        return new Promise( resolve =>
        {
            const body: Buffer[] = [];

            request.on( 'data', ( chunk: Buffer ) => body.push( chunk ));
            request.on( 'end', () => resolve( Buffer.concat( body )));
        });
    }
}

function decorateArgument( type: RouteArgType, name: string | undefined, target: Object, propertyKey: string | symbol, parameterIndex: number )
{
    Meta.pushProperty( 'routeArguments', target, propertyKey, { index: parameterIndex, type, name, resolver: RESOLVERS[type]});
    Meta.getProperty<{index: number}[]>( 'routeArguments', target, propertyKey ).sort(( a, b ) => a.index - b.index );
}

const argumentDecorator = ( type: RouteArgType ) => decorateArgument.bind( null, type, undefined );
const namedArgumentDecorator = ( type: RouteArgType ) => ( name: string ) => decorateArgument.bind( null, type, name );

export const Request    = argumentDecorator('REQUEST');
export const Response   = argumentDecorator('RESPONSE');
export const Header     = namedArgumentDecorator('HEADER');
export const Headers    = argumentDecorator('HEADERS');
export const IP         = argumentDecorator('IP');
export const Url        = argumentDecorator('URL');
export const Domain     = argumentDecorator('DOMAIN');
export const Path       = argumentDecorator('PATH');
export const Param      = namedArgumentDecorator('PARAM');
export const Params     = argumentDecorator('PARAMS');
export const Body       = argumentDecorator('BODY');
export const RawBody    = argumentDecorator('RAW_BODY');
//export const Query      = namedArgumentDecorator('QUERY');

export function Query<T>( name: string )
{
    //const validator = typia.createValidate<{ foo: string }>();

    //console.log( validator );

    return ( target: Object, propertyKey: string | symbol, parameterIndex: number ) =>
    {
        decorateArgument( 'QUERY', name, target, propertyKey, parameterIndex );
    }
};