import { EndpointRequest, EndpointResponse } from '../router';

export type RouteArgType = 'REQUEST' | 'RESPONSE' | 'HEADERS' | 'HEADER' | 'URL' | 'DOMAIN' | 'PATH' | 'PARAMS' | 'PARAM' | 'QUERY' | 'BODY';

export type RouteMetadata =
{
    method  : 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
    path    : string
    fn      : string
    args    : { index: number, type: RouteArgType, name: string, resolver: RouteArgResolver }[]
}

export type RouteArgResolver = ( arg: RouteMetadata['args'][0], request: EndpointRequest, response: EndpointResponse ) => any;