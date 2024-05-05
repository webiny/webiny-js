import { Project, ArrayLiteralExpression, Node } from "ts-morph";
import path from "path";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";

interface Params {
    pluginName: string;
    packageName: string;
}

export const addPluginToApiApp = async (params: Params): Promise<void> => {
    const { pluginName, packageName } = params;

    const scaffoldsFilePath = path.join(
        "apps",
        "api",
        "graphql",
        "src",
        "plugins",
        "scaffolds",
        "index.ts"
    );

    const pluginsFactory = pluginName + "PluginsFactory";
    const importName = "{ createPlugins as " + pluginsFactory + " }";
    const importPath = packageName;

    const project = new Project();
    project.addSourceFileAtPath(scaffoldsFilePath);

    const source = project.getSourceFileOrThrow(scaffoldsFilePath);

    const existingImportDeclaration = source.getImportDeclaration(importPath);
    if (existingImportDeclaration) {
        throw new Error(
            `Could not import  "${importPath}" in "${scaffoldsFilePath}" as it already exists.`
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

    pluginsArray.addElement(pluginsFactory);

    await source.save();

    await formatCode(scaffoldsFilePath, {});
};
