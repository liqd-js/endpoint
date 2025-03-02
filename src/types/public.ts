import { InternalServerError, ServerError } from '../errors';
import { EndpointRequest, EndpointResponse } from '../router';

export { EndpointRequest, EndpointResponse };

export class Controller{};

export class Middleware
{
    constructor()
    {
        if( this.constructor === Middleware )
        {
            throw new InternalServerError( undefined, { message: 'Middleware is an abstract class and cannot be instantiated' });
        }
        else
        {
            const proto = Object.getPrototypeOf( this );

            if( proto.hasOwnProperty('use') && proto.hasOwnProperty('useCallback'))
            {
                throw new InternalServerError( undefined, { message: `Middleware ${this.constructor.name} must implement use or useCallback method, not both` });
            }

            if( !proto.hasOwnProperty('use') && !proto.hasOwnProperty('useCallback'))
            {
                throw new InternalServerError( undefined, { message: `Middleware ${this.constructor.name} must implement use or useCallback method` });
            }
        }
    }

    public use( request: EndpointRequest, response: EndpointResponse ): Promise<void> | void
    {
        throw new InternalServerError( undefined, { message: `Middleware ${this.constructor.name} must implement use method` });
    }

    public useCallback( request: EndpointRequest, response: EndpointResponse, next: ( error?: ServerError ) => Promise<void> ): Promise<void> | void
    {
        throw new InternalServerError( undefined, { message: `Middleware ${this.constructor.name} must implement useCallback method` });
    }
}

export type CorsOptionsBase = true | false | ( string | RegExp )[] |
{
    origin      : ( string | RegExp )[],
    methods?    : string[],
    headers?    : string[],
    credentials?: boolean,
    maxAge?     : number
};

export type CorsOptions = CorsOptionsBase | (( request: EndpointRequest ) => CorsOptionsBase );

export type EndpointCreateOptions =
{
    controllers : Controller[],
    middlewares?: Middleware[],
    cors?       : CorsOptions,
    port        : number | string
}