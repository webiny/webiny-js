import React from "react";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { Node, Project, ArrayLiteralExpression } from "ts-morph";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { zodSrcPath } from "@webiny/project/defineExtension/zodTypes/zodSrcPath.js";
import { ExtensionSrcResolver } from "@webiny/project/utils/index.js";
import { ApiPulumi } from "~/pulumi/extensions/ApiPulumi.js";
import { createPathResolver } from "@webiny/project";

const p = createPathResolver(import.meta.dirname);

const HTTP_METHODS = ["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT", "OPTIONS", "ANY"] as const;

export const ApiRoute = defineExtension({
    type: "Api/Route",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Register a custom REST route on the API Gateway + GraphQL Lambda.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            path: z.string().startsWith("/"),
            method: z.enum(HTTP_METHODS),
            // The `src` file must default-export an HttpRoute implementation
            // (HttpRoute.createImplementation from @webiny/event-handler-core), the same shape as
            // the framework's own routes (e.g. createCmsRoute). Its `method`/`path` must match the
            // `method`/`path` params here (used to configure the API Gateway route).
            src: zodSrcPath({ project }),
            routeName: z.string().optional()
        });
    },
    async build(params, ctx) {
        const extensionsTsFilePath = ctx.project.paths.workspaceFolder
            .join("apps", "api", "graphql", "src", "extensions.ts")
            .toString();

        const absoluteSrcFilePath = ExtensionSrcResolver.resolvePath(params.src, ctx.project);

        // Stable alias to avoid naming conflicts across multiple routes.
        const hash = crypto.createHash("sha256").update(params.src).digest("hex");
        const alias = `ApiRoute_${hash.slice(-10)}`;

        const importPath = path
            .relative(path.dirname(extensionsTsFilePath), absoluteSrcFilePath)
            .replace(/\.tsx?$/, ".js");

        const tsProject = new Project();
        tsProject.addSourceFileAtPath(extensionsTsFilePath);
        const source = tsProject.getSourceFileOrThrow(extensionsTsFilePath);

        // Skip if the route handler is already registered.
        if (source.getImportDeclaration(importPath)) {
            return;
        }

        // Insert handler import after the last existing import.
        let insertIndex = 1;
        const importDeclarations = source.getImportDeclarations();
        if (importDeclarations.length) {
            insertIndex = importDeclarations[importDeclarations.length - 1].getChildIndex() + 1;
        }

        source.insertImportDeclaration(insertIndex, {
            defaultImport: alias,
            moduleSpecifier: importPath
        });

        // Ensure createRegisterExtensionPlugin import exists.
        const registerExtensionPluginPath = "@webiny/handler/plugins/RegisterExtensionPlugin.js";
        if (!source.getImportDeclaration(registerExtensionPluginPath)) {
            const lastIdx =
                source
                    .getImportDeclarations()
                    [source.getImportDeclarations().length - 1].getChildIndex() + 1;
            source.insertImportDeclaration(lastIdx, {
                namedImports: ["createRegisterExtensionPlugin"],
                moduleSpecifier: registerExtensionPluginPath
            });
        }

        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        // Register the route's HttpRoute implementation in the DI container. The DI HttpRouter
        // resolves every registered HttpRoute and dispatches by matching the request method/path
        // against each route's own `method`/`path` — no explicit route wiring needed.
        pluginsArray.addElement(
            `\ncreateRegisterExtensionPlugin(ctx => {\n\tregisterExtension(ctx.container, ${alias});\n})`
        );

        await source.save();
    },
    render() {
        return <ApiPulumi src={p("RegisterRoutesPulumi.js")} />;
    }
});
