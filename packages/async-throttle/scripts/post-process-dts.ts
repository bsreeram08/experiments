import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const dtsPath = path.resolve(
    __dirname,
    '../../../dist/packages/async-throttle/index.d.ts'
);

function processFile(fileName: string) {
    console.log(`Starting to process file: ${fileName}`);
    const program = ts.createProgram([fileName], {});
    const sourceFile = program.getSourceFile(fileName);
    if (!sourceFile) return;

    const transformer: ts.TransformerFactory<ts.SourceFile> =
        (context: ts.TransformationContext) => (rootNode: ts.SourceFile) => {
            function visit(node: ts.Node): ts.Node | ts.Node[] | undefined {
                if (ts.isModuleDeclaration(node) && !node.body) {
                    // Remove 'declare module' wrappers
                    return undefined;
                }
                if (ts.isModuleDeclaration(node)) {
                    // Remove 'declare module' wrappers
                    const body = node.body;
                    if (body && ts.isModuleBlock(body)) {
                        return Array.from(body.statements);
                    }
                    return ts.visitEachChild(node, visit, context);
                }

                if (ts.isExportDeclaration(node) && !node.exportClause) {
                    // Remove 'export {}' statements
                    return undefined;
                }

                if (
                    ts.isExportDeclaration(node) &&
                    (!node.exportClause ||
                        (node.moduleSpecifier &&
                            ts.isStringLiteral(node.moduleSpecifier) &&
                            node.moduleSpecifier.text === '*'))
                ) {
                    return undefined;
                }

                return ts.visitEachChild(node, visit, context);
            }
            return ts.visitNode(rootNode, visit) as ts.SourceFile;
        };

    const result = ts.transform(sourceFile, [transformer]);
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const transformedSourceFile = result.transformed[0];

    let output = printer.printFile(transformedSourceFile);

    // Remove empty brackets and clean up whitespace
    output = output
        .replace(/\{\s*\}/g, '')
        .replace(/^\s*[\r\n]/gm, '')
        .replace('export * from "src/lib/async-throttle";', '')
        .trim();

    fs.writeFileSync(fileName, output);
    console.log('Declaration file has been processed.');
}

processFile(dtsPath);
