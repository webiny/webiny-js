import { defineExtension, zodSrcPath } from "@webiny/project/extensions/index.js";
import { z } from "zod";
import path from "path";
import { type JsxFragment, Node, Project } from "ts-morph";
import crypto from "crypto";

export const AdminExtension = defineExtension({
    type: "Admin/Extension",
    tags: { runtimeContext: "app-build", appName: "admin" },
    description: "Extend the Admin application with custom functionality.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodSrcPath({ project })
        });
    },
    async build(params, ctx) {
        const extensionsTsxFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "Extensions.tsx")
            .toString();

        // Resolve to absolute path for file operations.
        let absoluteSrcPath: string;
        if (params.src.startsWith("/extensions/")) {
            // Resolve from project root.
            absoluteSrcPath = ctx.project.paths.rootFolder.join(params.src).toString();
        } else {
            // Treat as absolute path.
            absoluteSrcPath = params.src;
        }

        // Generate a constant hash-based component name to avoid using timestamps.
        const hash = crypto.createHash("sha256").update(params.src).digest("hex");
        const componentName = `AdminExtension_${hash.slice(-10)}`;

        const project = new Project();

        const importPath = path
            .relative(path.dirname(extensionsTsxFilePath), absoluteSrcPath)
            .replace(".tsx", ".js");

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

        // Check if the file has a default export by importing it.

        const importedModule = await import(absoluteSrcPath);
        const hasDefaultExport = "default" in importedModule;

        // Export name is always the file name without extension.
        const exportName = path
            .basename(absoluteSrcPath)
            .replace(path.extname(absoluteSrcPath), "");

        // Support both default and named exports.
        if (hasDefaultExport) {
            source.insertImportDeclaration(index, {
                defaultImport: componentName,
                moduleSpecifier: importPath
            });
        } else {
            source.insertImportDeclaration(index, {
                namedImports: [{ name: exportName, alias: componentName }],
                moduleSpecifier: importPath
            });
        }

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
