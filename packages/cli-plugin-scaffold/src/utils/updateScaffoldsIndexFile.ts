import { Project, ArrayLiteralExpression, Node } from "ts-morph";

interface Params {
    scaffoldsIndexPath: string;
    importName: string;
    importPath: string;
    pluginsArrayElement?: string;
}
export default async (params: Params): Promise<void> => {
    const { scaffoldsIndexPath, importName, importPath, pluginsArrayElement } = params;
    const project = new Project();
    project.addSourceFileAtPath(scaffoldsIndexPath);

    const source = project.getSourceFileOrThrow(scaffoldsIndexPath);

    const existingImportDeclaration = source.getImportDeclaration(importPath);
    if (existingImportDeclaration) {
        throw new Error("Already exists.");
    }

    let index = 1;

    const importDeclarations = source.getImportDeclarations();
    if (importDeclarations.length) {
        const last = importDeclarations[importDeclarations.length - 1];
        index = last.getChildIndex() + 1;
    }

    source.insertImportDeclaration(index, {
        defaultImport: importName,
        moduleSpecifier: importPath
    });

    const pluginsArray = source.getFirstDescendant(node =>
        Node.isArrayLiteralExpression(node)
    ) as ArrayLiteralExpression;

    pluginsArray.addElement(pluginsArrayElement || importName);

    await source.save();
};
