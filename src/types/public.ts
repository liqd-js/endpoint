import { EndpointRequest } from '../router';

export class Controller
{
    public constructor()
    {

    }
};

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
    cors?       : CorsOptions,
    port        : number
}