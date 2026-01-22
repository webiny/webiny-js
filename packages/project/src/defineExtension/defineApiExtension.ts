import { z } from "zod";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import { Abstraction } from "@webiny/di";
import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/zodTypes/zodSrcPath.js";
import path from "path";
import crypto from "crypto";

export type DefineApiExtensionParams = {
    type: string;
    description?: string;
    abstraction?: Abstraction<any>;
};

export const defineApiExtension = (params: DefineApiExtensionParams) =>
    defineExtension({
        type: params.type,
        tags: { runtimeContext: "app-build", appName: "api" },
        description: params.description,
        multiple: true,
        paramsSchema: ({ project }) => {
            return z.object({
                src: zodSrcPath({ project, abstraction: params.abstraction }),
                exportName: z.string().optional()
            });
        },
        async build(params, ctx) {
            const extensionsTsFilePath = ctx.project.paths.workspaceFolder
                .join("apps", "api", "graphql", "src", "extensions.ts")
                .toString();

            const { src: extensionFilePath } = params;

            // Resolve to absolute path for file operations
            let absoluteExtensionFilePath: string;
            if (extensionFilePath.startsWith("/extensions/")) {
                // Resolve from project root
                absoluteExtensionFilePath = ctx.project.paths.rootFolder
                    .join(extensionFilePath)
                    .toString();
            } else {
                // Treat as absolute path
                absoluteExtensionFilePath = extensionFilePath;
            }

            const extensionFileName = path.basename(absoluteExtensionFilePath);

            // 1. Export name is always the file name without extension.
            const exportName = params.exportName ?? extensionFileName.replace(".ts", "");

            // 2. Alias name is "ApiExtension_" + hash of the file path. This way we
            //    avoid potential naming conflicts and keep the identifier constant.
            const hash = crypto.createHash("sha256").update(extensionFilePath).digest("hex");
            const exportNameAlias = `ApiExtension_${hash.slice(-10)}`;

            // 3. Calculate import path relative to `extensions.ts` file.
            const importPath = [
                path.relative(
                    path.dirname(extensionsTsFilePath),
                    path.dirname(absoluteExtensionFilePath)
                ),
                extensionFileName.replace(".ts", ".js")
            ].join("/");

            const project = new Project();
            project.addSourceFileAtPath(extensionsTsFilePath);

            const source = project.getSourceFileOrThrow(extensionsTsFilePath);

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
            const importedModule = await import(absoluteExtensionFilePath);
            const hasDefaultExport = "default" in importedModule;

            // Support both default and named exports.
            if (hasDefaultExport) {
                source.insertImportDeclaration(index, {
                    defaultImport: exportNameAlias,
                    moduleSpecifier: importPath
                });
            } else {
                source.insertImportDeclaration(index, {
                    namedImports: [{ name: exportName, alias: exportNameAlias }],
                    moduleSpecifier: importPath
                });
            }

            const pluginsArray = source.getFirstDescendant(node =>
                Node.isArrayLiteralExpression(node)
            ) as ArrayLiteralExpression;

            pluginsArray.addElement(
                `\ncreateContextPlugin(ctx => {\n\tregisterExtension(ctx.container, ${exportNameAlias});\n})`
            );

            {
                let index = 1;

                const importDeclarations = source.getImportDeclarations();
                if (importDeclarations.length) {
                    const last = importDeclarations[importDeclarations.length - 1];
                    index = last.getChildIndex() + 1;
                }

                const contextPluginImportPath = "@webiny/api/plugins/ContextPlugin";
                const existingContextPluginImport =
                    source.getImportDeclaration(contextPluginImportPath);
                if (!existingContextPluginImport) {
                    source.insertImportDeclaration(index, {
                        namedImports: ["createContextPlugin"],
                        moduleSpecifier: contextPluginImportPath
                    });
                }
            }

            await source.save();
        }
    });
