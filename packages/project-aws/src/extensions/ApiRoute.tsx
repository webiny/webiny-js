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

const METHOD_HANDLER: Record<string, string> = {
    DELETE: "onDelete",
    GET: "onGet",
    HEAD: "onHead",
    PATCH: "onPatch",
    POST: "onPost",
    PUT: "onPut",
    OPTIONS: "onOptions",
    ANY: "onAll"
};

export const ApiRoute = defineExtension({
    type: "Api/Route",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Register a custom REST route on the API Gateway + GraphQL Lambda.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            path: z.string().startsWith("/"),
            method: z.enum(HTTP_METHODS),
            // TODO: add zodSrcPath abstraction validation once Route abstraction is wired to zodSrcPath.
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

        // Ensure createContextPlugin import exists.
        const ctxPluginPath = "@webiny/api/plugins/ContextPlugin.js";
        if (!source.getImportDeclaration(ctxPluginPath)) {
            const lastIdx =
                source
                    .getImportDeclarations()
                    [source.getImportDeclarations().length - 1].getChildIndex() + 1;
            source.insertImportDeclaration(lastIdx, {
                namedImports: ["createContextPlugin"],
                moduleSpecifier: ctxPluginPath
            });
        }

        // Ensure createRoute and Route are imported from @webiny/handler.
        const handlerImportPath = "@webiny/handler";
        const existingHandlerImport = source.getImportDeclaration(handlerImportPath);
        const requiredHandlerImports = ["createRoute", "Route"];
        if (!existingHandlerImport) {
            const lastIdx =
                source
                    .getImportDeclarations()
                    [source.getImportDeclarations().length - 1].getChildIndex() + 1;
            source.insertImportDeclaration(lastIdx, {
                namedImports: requiredHandlerImports,
                moduleSpecifier: handlerImportPath
            });
        } else {
            const present = existingHandlerImport.getNamedImports().map(i => i.getName());
            for (const name of requiredHandlerImports) {
                if (!present.includes(name)) {
                    existingHandlerImport.addNamedImport(name);
                }
            }
        }

        const onMethod = METHOD_HANDLER[params.method];
        const routePath = params.path as `/${string}`;

        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        // Register factory in DI container.
        pluginsArray.addElement(
            `\ncreateContextPlugin(ctx => {\n\tregisterExtension(ctx.container, ${alias});\n})`
        );

        // Register Fastify route with hardcoded path/method.
        // We use resolveAll(Route) + instanceof to find the correct handler when multiple
        // Api.Route extensions are registered.
        pluginsArray.addElement(
            `\ncreateRoute(({ ${onMethod}, context }) => {\n` +
                `\t${onMethod}("${routePath}", async (request, reply) => {\n` +
                `\t\tconst instance = context.container.resolveAll(Route).find(i => i instanceof ${alias})!;\n` +
                `\t\treturn instance.execute(request, reply);\n` +
                `\t});\n` +
                `})`
        );

        await source.save();
    },
    render() {
        return <ApiPulumi src={p("RegisterRoutesPulumi.js")} />;
    }
});
