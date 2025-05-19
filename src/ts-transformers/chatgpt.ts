import * as ts from 'typescript';

export default function queryTransform(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  return (context) => {
    const factory = context.factory;

    return (sf) =>
      ts.visitNode(sf, function visitor(node): ts.Node {
        // Only care about parameter declarations with decorators
        if (ts.isParameter(node) && node.decorators) {
          const paramType = node.type;
          if (!paramType) return node;  // no declared type → skip

          const newDecorators = node.decorators.map((dec) => {
            // Must be a call: @Query(...)
            if (
              ts.isCallExpression(dec.expression) &&
              ts.isIdentifier(dec.expression.expression) &&
              dec.expression.expression.text === 'Query'
            ) {
              const args = dec.expression.arguments;
              // Only transform if there's < 2 args
              if (args.length < 2) {
                // build the literal { raw: T }
                const typeLiteral = factory.createTypeLiteralNode([
                  factory.createPropertySignature(
                    /*modifiers*/ undefined,
                    /*name*/ 'raw',
                    /*questionToken*/ undefined,
                    /*type*/ paramType
                  ),
                ]);

                // build typia.misc.createAssertPrune<{ raw: T }>()
                const typiaCall = factory.createCallExpression(
                  /*expression*/ factory.createPropertyAccessExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier('typia'),
                      factory.createIdentifier('misc')
                    ),
                    factory.createIdentifier('createAssertPrune')
                  ),
                  /*typeArgs*/ [typeLiteral],
                  /*args*/ []
                );

                // assemble new args: either [undefined, typiaCall] or [origArg, typiaCall]
                const newArgs = args.length === 0
                  ? [
                      factory.createIdentifier('undefined'),
                      typiaCall,
                    ]
                  : [
                      args[0],
                      typiaCall,
                    ];

                // update the decorator call
                const updatedCall = factory.updateCallExpression(
                  dec.expression,
                  dec.expression.expression,
                  dec.expression.typeArguments,
                  factory.createNodeArray(newArgs)
                );

                return factory.updateDecorator(dec, updatedCall);
              }
            }
            return dec;
          });

          // return a new ParameterDeclaration with the updated decorators
          return factory.updateParameterDeclaration(
            /*node*/ node,
            /*decorators*/ newDecorators,
            /*modifiers*/ node.modifiers,
            node.dotDotDotToken,
            node.name,
            node.questionToken,
            node.type,
            node.initializer
          );
        }

        return ts.visitEachChild(node, visitor, context);
      });
  };
}
