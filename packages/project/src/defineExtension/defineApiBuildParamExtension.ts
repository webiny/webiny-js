import { z } from "zod";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import { defineExtension } from "~/defineExtension/index.js";
import path from "path";
import crypto from "crypto";

export type DefineApiBuildParamExtensionParams = {
    type: string;
    description?: string;
};

export const defineApiBuildParamExtension = (params: DefineApiBuildParamExtensionParams) =>
    defineExtension({
        type: params.type,
        tags: { runtimeContext: "app-build", appName: "api" },
        description: params.description,
        multiple: true,
        paramsSchema: () => {
            return z.object({
                key: z.string(),
                value: z.string()
            });
        },
        async build(params, ctx) {
            const extensionsTsFilePath = ctx.project.paths.workspaceFolder
                .join("apps", "api", "graphql", "src", "extensions.ts")
                .toString();

            const { key, value } = params;

            // Generate a unique class name based on the key.
            const hash = crypto.createHash("sha256").update(key).digest("hex");
            const className = `BuildParam_${hash.slice(-10)}`;

            const project = new Project();
            project.addSourceFileAtPath(extensionsTsFilePath);

            const source = project.getSourceFileOrThrow(extensionsTsFilePath);

            // Check if this specific BuildParam already exists.
            const existingClass = source.getClass(className);
            if (existingClass) {
                return;
            }

            let index = 1;

            const importDeclarations = source.getImportDeclarations();
            if (importDeclarations.length) {
                const last = importDeclarations[importDeclarations.length - 1];
                index = last.getChildIndex() + 1;
            }

            // Add import for BuildParam if not present.
            const buildParamImportPath = "@webiny/api-core/exports/api/buildParam";
            const existingBuildParamImport = source.getImportDeclaration(buildParamImportPath);
            if (!existingBuildParamImport) {
                source.insertImportDeclaration(index, {
                    namedImports: ["BuildParam"],
                    moduleSpecifier: buildParamImportPath
                });
            }

            // Add the class definition before the plugins array.
            const pluginsArray = source.getFirstDescendant(node =>
                Node.isArrayLiteralExpression(node)
            ) as ArrayLiteralExpression;

            const classIndex = pluginsArray
                ? pluginsArray.getChildIndex()
                : source.getStatements().length;

            source.insertClass(classIndex, {
                name: className,
                implements: ["BuildParam.Interface"],
                properties: [
                    {
                        name: "key",
                        type: "string",
                        initializer: `"${key}"`
                    },
                    {
                        name: "value",
                        type: "string",
                        initializer: `"${value}"`
                    }
                ]
            });

            // Add the registration to the plugins array.
            pluginsArray.addElement(
                `\ncreateContextPlugin(ctx => {\n\tctx.container.registerImpl(BuildParam, ${className});\n})`
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
