import { Project, ArrayLiteralExpression, Node } from "ts-morph";

export default async ({ scaffoldsIndexPath, importName, importPath }) => {
    const project = new Project();
    project.addSourceFileAtPath(scaffoldsIndexPath);

    const source = project.getSourceFileOrThrow(scaffoldsIndexPath);

    const existingImportDeclaration = source.getImportDeclaration(importPath);
    if (existingImportDeclaration) {
        throw new Error('Already exists.')
    }

    const importDeclarations = source.getImportDeclarations();
    const last = importDeclarations[importDeclarations.length - 1];

    source.insertImportDeclaration(last.getChildIndex() + 1, {
        defaultImport: importName,
        moduleSpecifier: importPath
    });

    const pluginsArray = source.getFirstDescendant(node =>
        Node.isArrayLiteralExpression(node)
    ) as ArrayLiteralExpression;

    pluginsArray.addElement(importName);

    await source.save();
};
