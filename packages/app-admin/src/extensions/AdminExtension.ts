import { defineExtension, zodPathToFile } from "@webiny/project/extensions/index.js";
import { z } from "zod";
import path from "path";
import Case from "case";
import { type JsxFragment, Node, Project } from "ts-morph";

export const AdminExtension = defineExtension({
    type: "Admin/Extension",
    tags: { runtimeContext: "app-build", appName: "admin" },
    description: "Extend the Admin application with custom functionality.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToFile(project)
        });
    },
    async build(params, ctx) {
        const extensionsTsxFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "Extensions.tsx")
            .toString();

        const componentName = Case.pascal("Something" + Date.now()) + "Extension";

        const importName = "{ Extension as " + componentName + " }";
        const srcWithoutExt = params.src.replace(/\.[^/.]+$/, "");

        const project = new Project();

        const importPath = path.join(
            path.relative(
                path.dirname(extensionsTsxFilePath),
                ctx.project.paths.rootFolder.toString()
            ),
            srcWithoutExt
        );
        project.addSourceFileAtPath(extensionsTsxFilePath);

        const source = project.getSourceFileOrThrow(extensionsTsxFilePath);

        const existingImportDeclaration = source.getImportDeclaration(importPath);
        if (existingImportDeclaration) {
            return;
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
                `Could not find the "Extensions" React component in "${extensionsTsxFilePath}". Did you maybe change the name of the component?`
            );
        }

        const extensionsArrowFn = extensionsIdentifier.getNextSibling(node =>
            Node.isArrowFunction(node)
        );
        if (!extensionsArrowFn) {
            throw new Error(
                `Could not find the "Extensions" React component in "${extensionsTsxFilePath}". Did you maybe change its definition? It should be an arrow function.`
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
            `<><${componentName}/>${extensionsArrowFnFragmentChildrenText}</>`
        );

        await source.save();
    }
});
