import * as ts from "typescript";
import path from "path";

const fileRegex = /^\.\.?\/.*\.(jpg|png|svg|md|css)$/i;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const transformerProgram = (program: ts.Program) => {
    const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
        return sourceFile => {
            const visitor = (node: ts.Node): ts.Node => {
                if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                    const importPath = node.moduleSpecifier.text;
                    if (!fileRegex.test(importPath)) {
                        return node;
                    }

                    const { outDir, rootDir } = context.getCompilerOptions();
                    const sourceFile = ts.getSourceFileOfNode(node);
                    if (!sourceFile) {
                        return node;
                    }

                    const { fileName } = sourceFile;

                    const relativeToRoot = ts.getRelativePathFromDirectory(rootDir, fileName);
                    const outputFile = ts.resolvePath(outDir, relativeToRoot);
                    const importPathFull = ts.resolvePath(path.posix.dirname(fileName), importPath);
                    const relativeToAsset = ts.getRelativePathFromFile(outputFile, importPathFull);

                    return ts.updateImportDeclaration(
                        node,
                        node.decorators,
                        node.modifiers,
                        node.importClause,
                        ts.createLiteral(relativeToAsset)
                    );
                }

                return ts.visitEachChild(node, visitor, context);
            };

            return ts.visitNode(sourceFile, visitor);
        };
    };

    return transformerFactory;
};

export default transformerProgram;
