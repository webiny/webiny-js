import { Project, Node, JsxFragment } from "ts-morph";
import path from "path";
import { formatCode } from "@webiny/cli-plugin-scaffold/utils";

interface Params {
    extensionName: string;
    packageName: string;
}

export const addPluginToReactApp = async (params: Params): Promise<void> => {
    const { extensionName, packageName } = params;

    const extensionsFilePath = path.join("apps", "admin", "src", "Extensions.tsx");

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

    const extensionsIdentifier = source.getFirstDescendant(node => {
        if (!Node.isIdentifier(node)) {
            return false;
        }

        return node.getText() === "Extensions";
    });

    if (!extensionsIdentifier) {
        throw new Error(
            `Could not find the "Extensions" React component in "${extensionsFilePath}". Did you maybe change the name of the component?`
        );
    }

    const extensionsArrowFn = extensionsIdentifier.getNextSibling(node =>
        Node.isArrowFunction(node)
    );
    if (!extensionsArrowFn) {
        throw new Error(
            `Could not find the "Extensions" React component in "${extensionsFilePath}". Did you maybe change its definition? It should be an arrow function.`
        );
    }

    const extensionsArrowFnFragment = extensionsArrowFn.getFirstDescendant(node => {
        return Node.isJsxFragment(node);
    }) as JsxFragment;

    const extensionsArrowFnFragmentChildrenText = extensionsArrowFnFragment
        .getFullText()
        .replace("<>", "")
        .replace("</>", "")
        .trim();

    extensionsArrowFnFragment.replaceWithText(
        `<>{${extensionName}ExtensionFactory()}${extensionsArrowFnFragmentChildrenText}</>`
    );

    await source.save();

    await formatCode(extensionsFilePath, {});
};
