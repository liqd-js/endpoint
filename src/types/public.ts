import { EndpointRequest, EndpointResponse } from '../router';

export { EndpointRequest, EndpointResponse };

export class Controller{};

export class Middleware
{
    public use( request: EndpointRequest, response: EndpointResponse, next: () => void ): Promise<void> | void
    {
        throw new Error('Method not implemented.');
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
    port        : number
}