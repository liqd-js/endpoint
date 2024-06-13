import 'reflect-metadata';

export default class Meta
{
    private static symbols = new Map<string,Symbol>();

    private static symbol( key: string ): Symbol
    {
        !Meta.symbols.has( key ) && Meta.symbols.set( key, Symbol( key ));

        return Meta.symbols.get( key )!;
    }

    public static get<V,T extends Object>( key: string, target: T, initial?: V ): V
    {
        const symbol = Meta.symbol( key );

        !Reflect.hasOwnMetadata( symbol, target ) && initial !== undefined && Reflect.defineMetadata( symbol, initial, target );

        return Reflect.getOwnMetadata( symbol, target );
    }

    public static getProperty<V,T extends Object>( key: string, target: T, property: string | symbol, initial?: V ): V
    {
        const symbol = Meta.symbol( key );

        !Reflect.hasOwnMetadata( symbol, target, property ) && initial !== undefined && Reflect.defineMetadata( symbol, initial, target, property );

        return Reflect.getOwnMetadata( symbol, target, property );
    }

    public static push<V,T extends Object>( key: string, target: T, value: V ): void
    {
        Meta.get( key, target, [] as V[] ).push( value );
    }

    public static pushProperty<V,T extends Object>( key: string, target: T, property: string | symbol, value: V ): void
    {
        Meta.getProperty( key, target, property, [] as V[] ).push( value );
    }
}