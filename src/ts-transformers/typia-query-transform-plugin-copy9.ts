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

        //return ( sourceFile: ts.SourceFile ) => decoratorsTransform( sourceFile );
        return ( sourceFile: ts.SourceFile ) => typiaTransform( decoratorsTransform( sourceFile ));
    }
}

const endpointDecoratorsTransformer = ( program: ts.Program ): ts.TransformerFactory<ts.SourceFile> =>
{
    const typeChecker = program.getTypeChecker();
    let typiaIdentifier: ts.Identifier | undefined;

    // Create array of found symbols
    const foundSymbols = new Array<ts.Symbol>();

    return ( context: ts.TransformationContext ) => 
    {
        return sourceFile => 
        {
            //const visitor = ( node: ts.TypeNode ): ts.TypeNode => 
            const visitor = ( node: ts.Node ): ts.Node => 
            {
                if( ts.isImportDeclaration( node ))
                {
                    if( ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === 'typia' && node.importClause && node.importClause.name && !typiaIdentifier )
                    {
                        typiaIdentifier = node.importClause.name;

                        console.log( `Found typia identifier: ${typiaIdentifier.text}`, sourceFile.fileName, node );
                    }

                    return node;
                }

                if (ts.isParameter(node) && node.modifiers && true) {
                const param = node as ts.ParameterDeclaration;

                const newModifiers = param.modifiers!.map(mod => {
                    if (ts.isDecorator(mod)) {
                        const dec = mod;

                        if (
                            ts.isCallExpression(dec.expression) &&
                            ts.isIdentifier(dec.expression.expression) &&
                            dec.expression.expression.text === 'Query'
                        ) {
                            console.log('Found @Query decorator', dec.getText());

                            const args = dec.expression.arguments;

                            if (args.length < 2) {
                                const paramType = param.type;
                                if (paramType) {
                                    const typeString = typeChecker.typeToString(
                                        typeChecker.getTypeFromTypeNode(paramType)
                                    );

                                    const newArg = ts.factory.createCallExpression(
                                        ts.factory.createPropertyAccessExpression(
                                            ts.factory.createPropertyAccessExpression(
                                                typiaIdentifier!,
                                                //ts.factory.createIdentifier('typia'),
                                                'misc'
                                            ),
                                            'createAssertPrune'
                                        ),
                                        [
                                            ts.factory.createTypeLiteralNode([
                                                ts.factory.createPropertySignature(
                                                    undefined,
                                                    'raw',
                                                    undefined,
                                                    ts.factory.createTypeReferenceNode(typeString)
                                                )
                                            ])
                                        ],
                                        []
                                    );

                                    const updatedDecorator = ts.factory.updateDecorator(
                                        dec,
                                        ts.factory.updateCallExpression(
                                            dec.expression,
                                            dec.expression.expression,
                                            dec.expression.typeArguments,
                                            args.length === 0
                                                ? [ts.factory.createIdentifier('undefined'), newArg]
                                                : [args[0], newArg]
                                        )
                                    );

                                    return updatedDecorator;
                                }
                            }
                        }
                    }

                    console.log('DONE');

                    return mod;
                });

                return ts.factory.updateParameterDeclaration(
                    param,
                    newModifiers,        // updated modifiers (decorators included)
                    param.dotDotDotToken,
                    param.name,
                    param.questionToken,
                    param.type,
                    param.initializer
                );
            }


                return ts.visitEachChild( node, visitor, context );
            };

            const res = ts.visitNode( sourceFile, visitor, ts.isSourceFile );

            const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

            const transformedCode = printer.printFile(res);

            //console.log(`Transformed source (${sourceFile.fileName}):\n`, transformedCode);

            //console.log( `Visiting source file: ${sourceFile.fileName}`, res.getText() );

            return res;
        }
    }
}