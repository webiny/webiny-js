import { Project, Node, JsxFragment } from "ts-morph";
import path from "path";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";

interface Params {
    pluginName: string;
    packageName: string;
}

export const addPluginToReactApp = async (params: Params): Promise<void> => {
    const { pluginName, packageName } = params;

    const scaffoldsFilePath = path.join("apps", "admin", "src", "Extensions.tsx");

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

    const scaffoldsIdentifier = source.getFirstDescendant(node => {
        if (!Node.isIdentifier(node)) {
            return false;
        }

        return node.getText() === "Scaffolds";
    });

    if (!scaffoldsIdentifier) {
        throw new Error(
            `Could not find the "Scaffolds" React component in "${scaffoldsFilePath}". Did you maybe change the name of the component?`
        );
    }

    const scaffoldsArrowFn = scaffoldsIdentifier.getNextSibling(node => Node.isArrowFunction(node));
    if (!scaffoldsArrowFn) {
        throw new Error(
            `Could not find the "Scaffolds" React component in "${scaffoldsFilePath}". Did you maybe change its definition? It should be an arrow function.`
        );
    }

    const scaffoldsArrowFnFragment = scaffoldsArrowFn.getFirstDescendant(node => {
        return Node.isJsxFragment(node);
    }) as JsxFragment;

    const scaffoldsArrowFnFragmentChildrenText = scaffoldsArrowFnFragment
        .getFullText()
        .replace("<>", "")
        .replace("</>", "")
        .trim();

    scaffoldsArrowFnFragment.replaceWithText(
        `<>{${pluginName}PluginsFactory}${scaffoldsArrowFnFragmentChildrenText}</>`
    );

    await source.save();

    await formatCode(scaffoldsFilePath, {});
};
