import 'reflect-metadata';

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

    public static push<V,T extends Object=any>( key: string, target: T, value: V ): void
    {
        Meta.get( key, target, [] as V[] ).push( value );
    }

    public static pushProperty<V,T extends Object=any>( key: string, target: T, property: string | symbol, value: V ): void
    {
        Meta.getProperty( key, target, property, [] as V[] ).push( value );
    }
}