import * as ts from 'typescript';
import typiaTransformer from 'typia/lib/transform';

export default function enpointTransformer( program: ts.Program )
{
    const decoratorsFactory = transformer( program );
    const typiaFactory      = typiaTransformer( program, undefined, { addDiagnostic: () => 0 });

    return ( context: ts.TransformationContext ) =>
    {
        const decoratorsTransform   = decoratorsFactory( context );
        const typiaTransform        = typiaFactory( context );

        return ( sourceFile: ts.SourceFile ) => typiaTransform( decoratorsTransform( sourceFile ));
    };
}

function getNextParameter(
  node: ts.Node
): ts.ParameterDeclaration | undefined {
  if (!ts.isParameter(node)) return undefined;

  const sig  = node.parent as ts.SignatureDeclarationBase;
  const list = sig.parameters;
  const idx  = list.findIndex(p => p === node);
  return idx >= 0 && idx + 1 < list.length ? list[idx + 1] : undefined;
}

function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
    const checker = program.getTypeChecker();

    return (context) => {
        const visitor: ts.Visitor = (node) => {
            if (node.kind === ts.SyntaxKind.Parameter) {
                const param = node as ts.ParameterDeclaration;
                console.log('Parameter found:', param.getText());

                if (param.type) {
                    const type = checker.getTypeFromTypeNode(param.type);
                    console.log('Parameter type:', checker.typeToString(type));
                }
            }

            return ts.visitEachChild(node, visitor, context);
        };

        return (sourceFile) => ts.visitNode(sourceFile, visitor)! as ts.SourceFile;
    };
}