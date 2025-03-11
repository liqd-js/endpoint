import { EndpointRequest } from '../router';

const sep = '&', eq = '=', del = ';';
const intRE = /^[0-9]+$/;

type QueryItemType = 'null' | 'undefined' | 'boolean' | 'number';

/*function Value( value: string, types: ( 'null' | 'undefined' | 'boolean' | 'number' )[] = [])
{
    if( value === 'null' && types.includes( 'null' )){ return null }
    if( value === 'undefined' && types.includes( 'undefined' )){ return undefined }
    if([ 'true', 'false' ].includes( value ) && types.includes( 'boolean' )){ return value === 'true' }
    if(/^[+-]?[0-9]+$/.test( value ) && types.includes( 'number' )){ return parseInt( value )}
    if(/^[+-]?([0-9]*\.[0-9]+)$/.test( value ) && types.includes( 'number' )){ return parseFloat( value )}

    return value;
}*/

const Query = new Proxy( Object, 
{
    construct: () =>
    {
        let query: any = {};

        Object.defineProperty( query, 'assign', { value: ( key: string | number, value: string/*, types: QueryItemType[]*/ ) =>
        {
            let keys = key.toString().replace(/\]\[/g, '[').replace(/]$/,'').split('['), obj = query, parent, parent_key;
            //let parsedValue = types ? Value( value, types ) : value;

            for( let i = 0; i < keys.length; ++i )
            {
                if(( key = keys[i] ) && intRE.test( key.toString() )){ key = parseInt( keys[i] ); }
                else if( key === '' )
                {
                    key = Array.isArray( obj ) ? obj.length - 1 : Math.max( -1, ...Object.keys(obj).map( k => intRE.test(k) ? parseInt(k) : -1 ));

                    if( key === -1 || i === keys.length - 1 || obj[key]?.hasOwnProperty( keys[i+1] ))
                    {
                        key += 1;
                    }
                }

                if( typeof key === 'string' && Array.isArray( obj ))
                {
                    parent[parent_key!] = obj = obj.reduce(( o, v, i ) => ( o[i] = v, o ), {});
                }

                if( i < keys.length - 1 )
                {
                    if( !obj[key] )
                    {
                        obj[key] = ( keys[i+1] === '' || intRE.test( keys[i+1] )) ? [] : {};
                    }

                    parent = obj;
                    parent_key = key;
                    obj = obj[key];
                }
                else
                {
                    if( obj[key] !== undefined )
                    {
                        if( Array.isArray( obj[key] ))
                        {
                            obj[key].push( value )
                        }
                        else if( typeof obj[key] === 'object' )
                        {
                            obj[key][ Math.max( -1, ...Object.keys(obj).map( k => intRE.test(k) ? parseInt(k) : -1 )) + 1 ] = value;
                        }
                        else
                        {
                            ( obj[key] = [ obj[key] ]).push( value );
                        }
                    }
                    else
                    {
                        obj[key] = value;
                    }
                }
            }
        }});

        return query;
    }
});

export class QueryParser
{
    public static parse<T>( querystring: string ): T
    {
        let data = new Query(), value, pair, last_pair = 0;

        do
        {
            pair = querystring.indexOf( sep, last_pair ); if( pair === -1 ){ pair = querystring.length; }

            if( pair - last_pair > 1 )
            {
                if( ~( value = querystring.indexOf( eq, last_pair )) && value < pair )
                {
                    //@ts-ignore
                    data.assign
                    ( 
                        decodeURIComponent( querystring.substring( last_pair, value ).replace(/\+/g, ' ' )),
                        decodeURIComponent( querystring.substring( value + 1, pair ).replace(/\+/g, ' ' )),
                        //options.types
                    );
                }
                else
                {
                    //@ts-ignore
                    data.assign( decodeURIComponent( querystring.substring( last_pair, pair ).replace(/\+/g, ' ' )), true );
                }
            }

            last_pair = pair + 1;
        }
        while( last_pair < querystring.length );

        return data as T;
    }
}

export class CookieParser
{
    public static parse<T>( cookiestring: string ): Record<string, string>
    {
        let cookies: Record<string, string> = {}, key, value, pair, last_pair = 0;

        if( cookiestring )
        {
            do
            {
                pair = cookiestring.indexOf( del, last_pair ); if( pair === -1 ){ pair = cookiestring.length; }

                if( pair - last_pair > 1 )
                {
                    if( ~( value = cookiestring.indexOf( eq, last_pair )) && value < pair )
                    {
                        key = decodeURIComponent( cookiestring.substring( last_pair, value ).trim() );
                        value = decodeURIComponent( cookiestring.substring( value + 1, pair ).trim() );

                        cookies[key] = value;
                    }
                }

                last_pair = pair + 1;
            }
            while( last_pair < cookiestring.length );
        }

        return cookies;
    }
}

export class IPParser
{
    public static parse( ip: string | EndpointRequest ): string
    {
        return this.normalizeIP( typeof ip === 'string' ? ip : this.getRequestIP( ip ));
    }

    public static getRequestIP( request: EndpointRequest ): string
    {
        return ( request.headers['x-forwarded-for'] || request.connection?.remoteAddress || request.socket.remoteAddress /* || request.connection?.socket?.remoteAddress */ || '' ).toString();
    }

    public static validateIP( ip: string )
    {
        return ip.includes(':') ? this.validateIPv6( ip ) : this.validateIPv4( ip );
    }

    public static validateIPv4( ip: string )
    {
        return ip.split('.').length === 4 && ip.split('.').every( seg => parseInt( seg ) >= 0 && parseInt( seg ) <= 255 );
    }

    public static validateIPv6( ip: string )
    {
        return ip.split(':').length === 8 && ip.split(':').every( seg => seg.length === 4 && parseInt( seg, 16 ) >= 0 && parseInt( seg, 16 ) <= 65535 );
    }

    public static normalizeIP( ip: string ): string
    {
        ip = ip.toLowerCase().split(',').shift()!.trim().replace(/^::ffff:([0-9.]+)$/, '$1');

        if( ip.includes(':') )
        {
            const zoneIndex = ip.indexOf('%'); // Remove any zone identifier (e.g., "%eth0")
            
            if( zoneIndex !== -1 )
            {
                ip = ip.substring(0, zoneIndex);
            }

            if( ip.includes('::') ) // If shorthand is used, expand it to normal notation
            {
                const parts = ip.split('::');
                const left = parts[0] ? parts[0].split(':') : [];
                const right = parts[1] ? parts[1].split(':') : [];
                const middle = new Array( 8 - ( left.length + right.length )).fill('0000');

                return left.concat( middle, right ).map( seg => seg.padStart(4, '0')).join(':');
            }
            else
            {
                return ip.split(':').map( seg => seg.padStart(4, '0')).join(':');
            }
        }

        if( !this.validateIP( ip )){ throw new Error( 'Invalid IPv4 address' )}

        return ip;
    }
}