import type { IncomingMessage, ServerResponse } from 'http';

// TODO zistit preco nejde '/avatars/:id/:size([0-9]*x[0-9]*).jpg'

const HTTP_METHODS = new Set([ 'HEAD', 'GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'CONNECT', 'TRACE' ]);
const PATH_REPEAT_RE = /(?<!\))\*/g;
const PATH_DOT_RE = /\./g;
const PATH_PARAM_WH_DEF_RE = /:([a-zA-Z_]+)\((([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(([^(]|\(\))+\))+\))+\))+\))+\))+\))+\))+)\)/g; // ([^(]|\\((?R)\\))+
const PATH_PARAM_WO_DEF_RE = /:([a-zA-Z_]+)/g;

export type EndpointRequest = IncomingMessage & { url: string, path: string, params: Object, query: any, body: Object };
export type EndpointResponse = ServerResponse<IncomingMessage> & { req: EndpointRequest };
export type RouterMethod = 'HEAD' | 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'CONNECT' | 'TRACE';
export type RouterPath = string | RegExp;
export type RouterNext = ( route?: 'route' | 'error' ) => void;
export type RouterHandler = ( req: EndpointRequest, res: EndpointResponse, next: RouterNext ) => void;

export default class Router
{
    private routes = new Array<{ methods: RouterMethod[], paths: RegExp[], handlers: RouterHandler[] }>();

    constructor()
    {
        
    }

    private pathToRegExp( path: string | RegExp )
    {
        if( path instanceof RegExp ){ return path }
        
        return new RegExp
        (   '^' + 
            path
                .replace( PATH_DOT_RE,          '\\.' )
                .replace( PATH_REPEAT_RE,       '.*' )
                .replace( PATH_PARAM_WH_DEF_RE, '(?<$1>$2)' )
                .replace( PATH_PARAM_WO_DEF_RE, '(?<$1>[^\\/]+)' )
            + '$',
            '' 
        );
    }

    public seo()
    {
        
    }

    public cors( methods: RouterMethod[], paths: RouterPath[] )
    {
        //this.routes.push({ methods, paths: paths.map( this.pathToRegExp )});
    }

    public listen( methods: RouterMethod[], paths: RouterPath[], handlers: RouterHandler[] )
    {
        this.routes.push({ methods, paths: paths.map( this.pathToRegExp ), handlers });
    }

    private async route( request: EndpointRequest, response: EndpointResponse, routeNo: number = 0, handlerNo: number = 0, skipHandlers: boolean = false, error: any = undefined )
    {
        let route = this.routes[ routeNo ];

        const handleRequest = async() =>
        {
            try
            {
                if( error )
                {
                    //await route.handlers[ handlerNo ]( error, request, response );
                }
                else
                {
                    await route.handlers[ handlerNo ]( request, response, route => 
                    {
                        this.route( request, response, routeNo, ++handlerNo, route === 'route' );
                    });
                }
            }
            catch( err )
            {
                this.route( request, response, routeNo, ++handlerNo, false, err );
            }
        }

        if( handlerNo )
        {
            if( !skipHandlers )
            {
                for( ; handlerNo < this.routes[ routeNo ].handlers.length; ++handlerNo )
                {
                    /*if(( error && this.routes[ routeNo ].type === 'error' ) || ( !error && route.type !== 'error' ))
                    {
                        return handleRequest();
                    }*/
                }
            }

            ++routeNo; handlerNo = 0;
        }

        for( ; routeNo < this.routes.length; ++routeNo )
        {
            route = this.routes[ routeNo ];

            if(/*( error && route.type === 'error' ) ||*/ ( !error && /*route.type !== 'error' &&*/ ( route.methods.length === 0 || route.methods.includes( request.method as any ))))
            {
                if( route.paths.length === 0 )
                {
                    //request.params = {};

                    return handleRequest();
                }
                else
                {
                    for( let pathNo = 0; pathNo < route.paths.length; ++pathNo )
                    {
                        let path = route.paths[ pathNo ].exec( request.path );

                        if( path )
                        {
                            request.params = path.groups || {};

                            return handleRequest();
                        }
                    }
                }
            }
        }
        
        /*if( !response.reply )
        {
            response.close();
        }
        else if( error )
        {
            response.reply( 500, 'Internal server error' );
        }
        else
        {
            // TODO custom 404
            response.reply( 404, 'Not found' );
        }*/

        response.end( 'Not found' );
    }

    public dispatch( req: EndpointRequest, res: EndpointResponse )
    {
        this.route( req, res );
    }
}