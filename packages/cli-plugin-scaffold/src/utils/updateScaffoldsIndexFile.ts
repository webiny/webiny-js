import { Project, SyntaxKind, ArrayLiteralExpression } from "ts-morph";

export default async ({ scaffoldsIndexPath, importName, importPath }) => {
    const project = new Project();
    project.addSourceFileAtPath(scaffoldsIndexPath);

    const source = project.getSourceFileOrThrow(scaffoldsIndexPath);

    source.insertStatements(1, `import ${importName} from "${importPath}";`);

    source.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.ArrayLiteralExpression) {
            const current = node as ArrayLiteralExpression;
            current.addElement(importName);
        }
    });

    await source.save();
};
