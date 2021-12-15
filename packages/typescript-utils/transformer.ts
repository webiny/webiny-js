import * as ts from "typescript";
import path from "path";

const pathsRegex = /^~\//i;
const fileRegex = /^\.\.?\/.*\.\w*$/i;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const transformerProgram = (program: ts.Program) => {
    const transformerFactory: ts.TransformerFactory<ts.SourceFile> = context => {
        const visitor = (node: ts.Node): ts.Node => {
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                let importPath = node.moduleSpecifier.text;

                const { outDir, rootDir } = context.getCompilerOptions();

                const sourceFile = ts.getSourceFileOfNode(node);
                if (!sourceFile) {
                    return node;
                }

                const { fileName } = sourceFile;

                if (pathsRegex.test(importPath)) {
                    // console.log("beforePath: " + importPath);
                    const fullImportPath = importPath.replace("~", rootDir);
                    importPath = ts.getRelativePathFromFile(fileName, fullImportPath);
                    // console.log("afterPath: " + importPath);
                }

                if (fileRegex.test(importPath)) {
                    const relativeToRoot = ts.getRelativePathFromDirectory(rootDir, fileName);
                    const outputFile = ts.resolvePath(outDir, relativeToRoot);
                    const importPathFull = ts.resolvePath(path.posix.dirname(fileName), importPath);
                    importPath = ts.getRelativePathFromFile(outputFile, importPathFull);
                }

                if (importPath !== node.moduleSpecifier.text) {
                    // console.log("source: " + fileName);
                    // console.log(`import: ${node.moduleSpecifier.text} => ${importPath}`);
                    return ts.updateImportDeclaration(
                        node,
                        node.decorators,
                        node.modifiers,
                        node.importClause,
                        ts.createLiteral(importPath)
                    );
                }

                return node;
            }

            return ts.visitEachChild(node, visitor, context);
        };

        return sourceFile => {
            return ts.visitNode(sourceFile, visitor);
        };
    };

    return transformerFactory;
};

export default transformerProgram;
