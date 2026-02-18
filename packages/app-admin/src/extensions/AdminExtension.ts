import { defineExtension, zodSrcPath } from "@webiny/project/extensions/index.js";
import { ImplPathResolver } from "@webiny/project/utils/index.js";
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
            src: zodSrcPath({ project }),
            exportName: z.string().optional()
        });
    },
    async build(params, ctx) {
        const extensionsTsxFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "admin", "src", "Extensions.tsx")
            .toString();

        const { src: extensionFilePath } = params;

        // Resolve to absolute path for file operations.
        const absoluteExtensionFilePath = ImplPathResolver.resolvePath(
            extensionFilePath,
            ctx.project
        );

        const extensionFileName = path.basename(absoluteExtensionFilePath);

        // Export name can be customized or defaults to the file name without extension.
        const exportName = params.exportName ?? path.parse(extensionFileName).name;

        // Generate a constant hash-based component name to avoid using timestamps.
        const hash = crypto.createHash("sha256").update(extensionFilePath).digest("hex");
        const componentName = `AdminExtension_${hash.slice(-10)}`;

        const project = new Project();

        const importPath = path
            .relative(path.dirname(extensionsTsxFilePath), absoluteExtensionFilePath)
            .replace(/\.tsx?$/, ".js");

        project.addSourceFileAtPath(extensionsTsxFilePath);

        const source = project.getSourceFileOrThrow(extensionsTsxFilePath);

        const existingImportDeclaration = source.getImportDeclaration(importPath);
        if (existingImportDeclaration) {
            return;
        }

        // Check if the extension file has a default export or named export
        const extensionProject = new Project();
        extensionProject.addSourceFileAtPath(absoluteExtensionFilePath);
        const extensionSource = extensionProject.getSourceFileOrThrow(absoluteExtensionFilePath);
        const hasDefaultExport = extensionSource.getDefaultExportSymbol() !== undefined;

        let index = 1;

        const importDeclarations = source.getImportDeclarations();
        if (importDeclarations.length) {
            const last = importDeclarations[importDeclarations.length - 1];
            index = last.getChildIndex() + 1;
        }

        // Import as default export if available, otherwise import named export
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
