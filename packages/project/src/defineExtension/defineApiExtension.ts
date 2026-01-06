import { z } from "zod";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import { Abstraction } from "@webiny/di";
import { defineExtension } from "~/defineExtension/index.js";
import { zodPathToAbstraction } from "~/defineExtension/zodTypes/zodPathToAbstraction.js";
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
            if (!params.abstraction) {
                return z.object({
                    src: z.string(),
                    exportName: z.string().optional()
                });
            }

            return z.object({
                src: zodPathToAbstraction(params.abstraction, project),
                exportName: z.string().optional()
            });
        },
        async build(params, ctx) {
            const extensionsTsFilePath = ctx.project.paths.workspaceFolder
                .join("apps", "api", "graphql", "src", "extensions.ts")
                .toString();

            const { src: extensionFilePath } = params;

            const extensionFileName = path.basename(extensionFilePath);

            // 1. Export name is always the file name without extension.
            const exportName = params.exportName ?? extensionFileName.replace(".ts", "");

            // 2. Alias name is "ApiExtension_" + hash of the file path. This way we
            //    avoid potential naming conflicts and keep the identifier constant.
            const hash = crypto.createHash("sha256").update(extensionFilePath).digest("hex");
            const exportNameAlias = `ApiExtension_${hash.slice(-10)}`;

            // 3. Calculate import path relative to `extensions.ts` file.
            const importPath = [
                path.relative(path.dirname(extensionsTsFilePath), path.dirname(extensionFilePath)),
                extensionFileName.replace(".ts", "")
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

            source.insertImportDeclaration(index, {
                namedImports: [{ name: exportName, alias: exportNameAlias }],
                moduleSpecifier: importPath
            });

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
