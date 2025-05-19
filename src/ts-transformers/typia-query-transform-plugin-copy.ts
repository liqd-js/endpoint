import * as ts from 'typescript';
import typiaTransformer from 'typia/lib/transform';

export default function enpointTransformer( program: ts.Program )
{
    const decoratorsFactory = endpointDecoratorsTransformer( program );
    const typiaFactory      = typiaTransformer( program, undefined, { addDiagnostic: () => 0 });

    return ( context: ts.TransformationContext ) =>
    {
        const decoratorsTransform   = decoratorsFactory( context );
        const typiaTransform        = typiaFactory( context );

        return ( sourceFile: ts.SourceFile ) => typiaTransform( decoratorsTransform( sourceFile ));
    };
}

const endpointDecoratorsTransformer = ( program: ts.Program ) =>
{
    const typeChecker = program.getTypeChecker();

    // Create array of found symbols
    const foundSymbols = new Array<ts.Symbol>();

    const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => 
    {
        return sourceFile => 
        {
            const visitor = ( node: ts.Node ): ts.Node => 
            {
                console.log( `Visiting node: ${node.getText()}` );

                if( ts.isIdentifier( node ))
                {
                    return node;
                }

                return ts.visitEachChild( node, visitor, context );
            };

            return ts.visitNode( sourceFile, visitor, ts.isSourceFile );
        }
    }

    return transformerFactory;
}