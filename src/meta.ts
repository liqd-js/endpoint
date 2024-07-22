import 'reflect-metadata';

export function objectSet( obj: Record<string, unknown>, path: string[], value: unknown )
{
    if( !path.length ){ throw new Error('Path is empty')}

    if( path.length === 1 )
    {
        obj[ path[0] ] = value;
    }
    else
    {
        if( !obj[ path[0] ] || typeof obj[ path[0] ] === 'object' ){ obj[ path[0] ] = {}}

        objectSet( obj[ path[0] ] as Record<string, unknown>, path.slice(1), value );
    }

    return obj;
}

export default class Meta
{
    private static symbols = new Map<string,Symbol>();

    private static symbol( key: string ): Symbol
    {
        !Meta.symbols.has( key ) && Meta.symbols.set( key, Symbol( key ));

        return Meta.symbols.get( key )!;
    }

    public static has<T extends Object=any>( key: string, target: T ): boolean
    {
        return Reflect.hasOwnMetadata( Meta.symbol( key ), target );
    }

    public static hasProperty<T extends Object=any>( key: string, target: T, property: string | symbol ): boolean
    {
        return Reflect.hasOwnMetadata( Meta.symbol( key ), target, property );
    }

    public static get<V,T extends Object=any>( key: string, target: T, initial?: V ): V
    {
        !Meta.has( key, target ) && initial !== undefined && Meta.set( key, target, initial );

        return Reflect.getOwnMetadata( Meta.symbol( key ), target );
    }

    public static getProperty<V,T extends Object=any>( key: string, target: T, property: string | symbol, initial?: V ): V
    {
        !Meta.hasProperty( key, target, property ) && initial !== undefined && Meta.setProperty( key, target, property, initial );

        return Reflect.getOwnMetadata( Meta.symbol( key ), target, property );
    }

    public static set<V,T extends Object=any>( key: string, target: T, value: V ): void
    {
        Reflect.defineMetadata( Meta.symbol( key ), value, target );
    }

    public static setProperty<V,T extends Object=any>( key: string, target: T, property: string | symbol, value: V ): void
    {
        Reflect.defineMetadata( Meta.symbol( key ), value, target, property );
    }

    public static assign<V,T extends Object=any>( key: string, target: T, path: string, value: V ): void
    {
        Reflect.defineMetadata( Meta.symbol( key ), objectSet( Meta.get( key, target, {} ), path.split('.'), value ), target );
    }

    public static assignProperty<V,T extends Object=any>( key: string, target: T, property: string | symbol, path: string, value: V ): void
    {
        Reflect.defineMetadata( Meta.symbol( key ), objectSet( Meta.get( key, target, {} ), path.split('.'), value ), target, property );
    }

    public static push<V,T extends Object=any>( key: string, target: T, value: V ): void
    {
        Meta.get( key, target, [] as V[] ).push( value );
    }

    public static pushProperty<V,T extends Object=any>( key: string, target: T, property: string | symbol, value: V ): void
    {
        Meta.getProperty( key, target, property, [] as V[] ).push( value );
    }
}