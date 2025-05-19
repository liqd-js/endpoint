import * as ts from 'typescript';

const endpointDecoratorsTransformer = (
    program: ts.Program
): ts.TransformerFactory<ts.SourceFile> => {
    const typeChecker = program.getTypeChecker();
    let typiaIdentifier: ts.Identifier | undefined;

    return (context: ts.TransformationContext) => {
        const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
            // Step 1: Capture the imported identifier explicitly
            if (ts.isImportDeclaration(node)) {
                if (
                    ts.isStringLiteral(node.moduleSpecifier) &&
                    node.moduleSpecifier.text === 'typia' &&
                    node.importClause &&
                    node.importClause.name
                ) {
                    typiaIdentifier = node.importClause.name;
                }
                return node;
            }

            // Step 2: Transform @Query decorators
            if (ts.isParameter(node) && node.modifiers && typiaIdentifier) {
                const param = node as ts.ParameterDeclaration;

                const newModifiers = param.modifiers.map(mod => {
                    if (ts.isDecorator(mod)) {
                        const dec = mod as ts.Decorator;

                        if (
                            ts.isCallExpression(dec.expression) &&
                            ts.isIdentifier(dec.expression.expression) &&
                            dec.expression.expression.text === 'Query'
                        ) {
                            const args = dec.expression.arguments;

                            if (args.length < 2 && param.type) {
                                const typeNode = ts.factory.createTypeLiteralNode([
                                    ts.factory.createPropertySignature(
                                        undefined,
                                        'raw',
                                        undefined,
                                        param.type
                                    ),
                                ]);

                                const typiaArg = ts.factory.createCallExpression(
                                    ts.factory.createPropertyAccessExpression(
                                        ts.factory.createPropertyAccessExpression(
                                            typiaIdentifier, // ← THIS FIXES YOUR PROBLEM!
                                            'misc'
                                        ),
                                        'createAssertPrune'
                                    ),
                                    [typeNode],
                                    []
                                );

                                const updatedDecorator = ts.factory.updateDecorator(
                                    dec,
                                    ts.factory.updateCallExpression(
                                        dec.expression,
                                        dec.expression.expression,
                                        dec.expression.typeArguments,
                                        args.length === 0
                                            ? [ts.factory.createIdentifier('undefined'), typiaArg]
                                            : [args[0], typiaArg]
                                    )
                                );

                                return updatedDecorator;
                            }
                        }
                    }
                    return mod;
                });

                return ts.factory.updateParameterDeclaration(
                    param,
                    newModifiers,
                    param.dotDotDotToken,
                    param.name,
                    param.questionToken,
                    param.type,
                    param.initializer
                );
            }

            return ts.visitEachChild(node, visitor, context);
        };

        return (sourceFile: ts.SourceFile): ts.SourceFile => {
            const transformed = ts.visitNode(sourceFile, visitor) as ts.SourceFile;

            // Sanity check (recommended)
            if (!typiaIdentifier) {
                console.warn(`Warning: "typia" import not found in ${sourceFile.fileName}.`);
            }

            return transformed;
        };
    };
};

export default endpointDecoratorsTransformer;
