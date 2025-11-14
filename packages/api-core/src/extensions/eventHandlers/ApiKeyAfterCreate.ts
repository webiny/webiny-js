import { z } from "zod";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import Case from "case";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodPathToAbstraction } from "@webiny/project/defineExtension/zodTypes/zodPathToAbstraction.js";
import { ApiKeyAfterCreateHandler } from "~/features/security/apiKeys/CreateApiKey/index.js";
import path from "path";

export const ApiKeyAfterCreate = defineExtension({
    type: "Security/ApiKeyAfterCreate",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Add custom logic to be executed after an API key is created.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            src: zodPathToAbstraction(ApiKeyAfterCreateHandler, project)
        });
    },
    async build(params, ctx) {
        const extensionsTsFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "extensions.ts")
            .toString();

        const { src: extensionFilePath } = params;

        const extensionFileName = path.basename(extensionFilePath);

        // 1. Export name is always the file name without extension.
        const exportName = extensionFileName.replace(".ts", "");

        // 2. Alias name is the PascalCase version of the file path. This way we
        //    avoid potential naming conflicts.
        const exportNameAlias = Case.pascal(extensionFilePath);

        // 3. Calculate import path relative to `extensions.ts` file.
        const importPath = [
            path.relative(path.dirname(extensionsTsFilePath), path.dirname(extensionFilePath)),
            extensionFileName.replace(".ts", "")
        ].join("/");

        const importName = `{ ${exportName} as ${exportNameAlias} }`;
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
            defaultImport: importName,
            moduleSpecifier: importPath
        });

        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        pluginsArray.addElement(`createContextPlugin((ctx) => {
        ctx.container.register(${exportNameAlias});
    })`);

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
                    defaultImport: "{createContextPlugin}",
                    moduleSpecifier: contextPluginImportPath
                });
            }
        }

        await source.save();
    }
});
