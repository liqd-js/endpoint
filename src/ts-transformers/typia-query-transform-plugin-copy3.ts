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
    }
}

const endpointDecoratorsTransformer = ( program: ts.Program ): ts.TransformerFactory<ts.SourceFile> =>
{
    const typeChecker = program.getTypeChecker();

    // Create array of found symbols
    const foundSymbols = new Array<ts.Symbol>();

    return ( context: ts.TransformationContext ) => 
    {
        return sourceFile => 
        {
            //const visitor = ( node: ts.TypeNode ): ts.TypeNode => 
            const visitor = ( node: ts.Node ): ts.Node => 
            {
                if( ts.isParameter( node ) && node.getChildAt(0)?.getText().startsWith( '@Query' ) )
                {
                    console.log( `Decorator`, node.getChildAt(0)?.getChildAt(0), ts.isDecorator( node.getChildAt(0)?.getChildAt(0) ) );

                    const param = node as ts.ParameterDeclaration;
                    console.log('Parameter found:', param.getText());
    
                    if (param.type) {
                        const type = typeChecker.getTypeFromTypeNode(param.type);
                        console.log('Parameter type:', typeChecker.typeToString(type));
                    }
                }

                return ts.visitEachChild( node, visitor, context );
            };

            const res = ts.visitNode( sourceFile, visitor, ts.isSourceFile );

            //console.log( `Visiting source file: ${sourceFile.fileName}`, res.getText() );

            return res;
        }
    }
}