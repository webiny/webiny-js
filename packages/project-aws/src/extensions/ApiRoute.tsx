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
import { toRouterPath } from "./routePath.js";

const p = createPathResolver(import.meta.dirname);

const HTTP_METHODS = ["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT", "OPTIONS", "ANY"] as const;

export const ApiRoute = defineExtension({
    type: "Api/Route",
    tags: { runtimeContext: "app-build", appName: "api" },
    description: "Register a custom REST route on the API Gateway + GraphQL Lambda.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            // Path parameters may be written `{orderId}` (API Gateway) or `:orderId` (the DI
            // router). Both are accepted and converted per consumer — see `routePath.ts`.
            path: z.string().startsWith("/"),
            method: z.enum(HTTP_METHODS),
            // The `src` file must default-export a route HANDLER — the result of
            // `HttpRouteHandler.createImplementation` from `@webiny/event-handler-core`. It does
            // NOT declare its own method/path: the `HttpRouteDefinition` the router matches on is
            // generated below from the props here, so the route the gateway forwards to and the
            // route the router matches cannot drift apart.
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

        // Ensure createHttpRouteDefinition import exists.
        const eventHandlerCorePath = "@webiny/event-handler-core";
        if (!source.getImportDeclaration(eventHandlerCorePath)) {
            const lastIdx =
                source
                    .getImportDeclarations()
                    [source.getImportDeclarations().length - 1].getChildIndex() + 1;
            source.insertImportDeclaration(lastIdx, {
                namedImports: ["createHttpRouteDefinition"],
                moduleSpecifier: eventHandlerCorePath
            });
        }

        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        // Register an HttpRouteDefinition built from the props above. The router matches on
        // definitions and only then builds the handler, so registering the handler alone would
        // leave the route unreachable: it deploys, API Gateway forwards to the Lambda, and dispatch
        // finds nothing. The path is converted to the router's `:param` syntax.
        const routerPath = toRouterPath(params.path);

        pluginsArray.addElement(
            `\ncreateRegisterExtensionPlugin(ctx => {\n\tctx.container.register(\n\t\tcreateHttpRouteDefinition({\n\t\t\tmethod: "${params.method}",\n\t\t\tpath: "${routerPath}",\n\t\t\thandler: ${alias}\n\t\t})\n\t);\n})`
        );

        await source.save();
    },
    render() {
        return <ApiPulumi src={p("RegisterRoutesPulumi.js")} />;
    }
});
