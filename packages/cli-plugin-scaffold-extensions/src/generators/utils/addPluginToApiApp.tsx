import { Project, ArrayLiteralExpression, Node } from "ts-morph";
import path from "path";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";

interface Params {
    extensionName: string;
    packageName: string;
}

export const addPluginToApiApp = async (params: Params): Promise<void> => {
    const { extensionName, packageName } = params;

    const extensionsFilePath = path.join("apps", "api", "graphql", "src", "extensions.ts");

    const extensionFactory = extensionName + "ExtensionFactory";
    const importName = "{ createExtension as " + extensionFactory + " }";
    const importPath = packageName;

    const project = new Project();
    project.addSourceFileAtPath(extensionsFilePath);

    const source = project.getSourceFileOrThrow(extensionsFilePath);

    const existingImportDeclaration = source.getImportDeclaration(importPath);
    if (existingImportDeclaration) {
        throw new Error(
            `Could not import  "${importPath}" in "${extensionsFilePath}" as it already exists.`
        );
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

    pluginsArray.addElement(`${extensionFactory}()`);

    await source.save();

    await formatCode(extensionsFilePath, {});
};
