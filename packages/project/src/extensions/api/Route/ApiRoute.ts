import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { Node } from "ts-morph";
import { Project } from "ts-morph";
import { type ArrayLiteralExpression } from "ts-morph";
import { type SourceFile } from "ts-morph";
import { defineExtension } from "~/defineExtension/index.js";
import { zodSrcPath } from "~/defineExtension/index.js";
import { ExtensionSrcResolver } from "~/index.js";
import { deriveRouteName } from "./routePath.js";
import { toRouterPath } from "./routePath.js";

/*
 * The methods the DI router can match. It compares a definition's method to the request's exactly,
 * so a catch-all such as API Gateway's `ANY` would register a route no request can reach.
 */
export const HTTP_METHODS = ["DELETE", "GET", "HEAD", "PATCH", "POST", "PUT", "OPTIONS"] as const;

const REGISTER_EXTENSION_PLUGIN_PATH = "@webiny/handler/plugins/RegisterExtensionPlugin.js";
const EVENT_HANDLER_CORE_PATH = "@webiny/event-handler-core";

// Right after the last import, or at the top of a file that has none.
const getImportInsertIndex = (source: SourceFile) => {
    const importDeclarations = source.getImportDeclarations();
    const lastImport = importDeclarations[importDeclarations.length - 1];
    if (!lastImport) {
        return 1;
    }
    return lastImport.getChildIndex() + 1;
};

/*
 * Adds `name` to the named imports from `moduleSpecifier`, adding the import declaration after the
 * last import when there is none. An existing import from the same module may name other things,
 * e.g. BuildParam imports `createRegisterBuildParamPlugin` from the RegisterExtensionPlugin path.
 */
const ensureNamedImport = (source: SourceFile, moduleSpecifier: string, name: string) => {
    const existing = source.getImportDeclaration(moduleSpecifier);
    if (existing) {
        const namedImports = existing.getNamedImports();
        if (!namedImports.some(i => i.getName() === name)) {
            existing.addNamedImport(name);
        }
        return;
    }

    const index = getImportInsertIndex(source);
    source.insertImportDeclaration(index, {
        namedImports: [name],
        moduleSpecifier
    });
};

/**
 * Registers a custom HTTP route with the API's DI router, for every hosting type. The build step
 * adds the route's handler and an `HttpRouteDefinition` to `apps/api/graphql/src/extensions.ts`.
 * That is all a standalone project needs, because its HTTP server hands every request to the
 * router. `@webiny/project-aws` registers its own implementation, which also adds the route to API
 * Gateway.
 */
export const ApiRoute = defineExtension({
    type: "Api/Route",
    tags: { runtimeContext: "app-build", appName: "api", hosting: "all" },
    description: "Register a custom HTTP route on the API.",
    multiple: true,
    paramsSchema: ({ project }) => {
        return z.object({
            // Path parameters may be written `{orderId}` (API Gateway) or `:orderId` (the DI
            // router). Both are accepted and converted per consumer, see `routePath.ts`.
            path: z.string().startsWith("/"),
            method: z.enum(HTTP_METHODS),
            // The `src` file must default-export a route HANDLER, the result of
            // `HttpRouteHandler.createImplementation` from `@webiny/event-handler-core`. It does
            // NOT declare its own method/path: the `HttpRouteDefinition` the router matches on is
            // generated below from the props here, so the route the gateway forwards to and the
            // route the router matches cannot drift apart.
            src: zodSrcPath({ project }),
            // Doubles as the route's DI name, so a decorator on HttpRouteDefinition can pick this
            // route out by it. Derived from path + method when omitted, same as the Pulumi name.
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

        const extensionsTsFolder = path.dirname(extensionsTsFilePath);
        const importPath = path
            .relative(extensionsTsFolder, absoluteSrcFilePath)
            .replace(/\.tsx?$/, ".js");

        const tsProject = new Project();
        tsProject.addSourceFileAtPath(extensionsTsFilePath);
        const source = tsProject.getSourceFileOrThrow(extensionsTsFilePath);

        // Register an HttpRouteDefinition built from the props above. The router matches on
        // definitions and only then builds the handler, so registering the handler alone would
        // leave the route unreachable: the request reaches the API and dispatch finds nothing. The
        // path is converted to the router's `:param` syntax.
        const routerPath = toRouterPath(params.path);
        const routeName = params.routeName ?? deriveRouteName(params.path, params.method);
        const nameProperty = `name: ${JSON.stringify(routeName)},`;
        const registration = `\ncreateRegisterExtensionPlugin(ctx => {\n\tctx.container.register(\n\t\tcreateHttpRouteDefinition({\n\t\t\t${nameProperty}\n\t\t\tmethod: ${JSON.stringify(params.method)},\n\t\t\tpath: ${JSON.stringify(routerPath)},\n\t\t\thandler: ${alias}\n\t\t})\n\t);\n})`;

        /*
         * The workspace is regenerated before every build and watch, so a registration already in
         * the file comes from another `<Api.Route>` in the same config. The same route twice is
         * skipped. Two routes with one name would be two DI definitions a decorator can't tell
         * apart, and on AWS two API Gateway resources with one Pulumi name, so the build stops.
         */
        const sourceText = source.getFullText();
        // Whitespace is ignored: ts-morph re-indents an element when it inserts it.
        const compactSource = sourceText.replace(/\s+/g, "");
        const compactRegistration = registration.replace(/\s+/g, "");
        if (compactSource.includes(compactRegistration)) {
            return;
        }
        if (sourceText.includes(nameProperty)) {
            throw new Error(
                `Two "Api.Route" entries resolve to the route name "${routeName}". A derived name leaves out path parameters, so "/orders" and "/orders/{id}" collide; set "routeName" on one of them.`
            );
        }

        // One handler file may back several routes, so its import is added only once.
        if (!source.getImportDeclaration(importPath)) {
            const index = getImportInsertIndex(source);
            source.insertImportDeclaration(index, {
                defaultImport: alias,
                moduleSpecifier: importPath
            });
        }

        ensureNamedImport(source, REGISTER_EXTENSION_PLUGIN_PATH, "createRegisterExtensionPlugin");
        ensureNamedImport(source, EVENT_HANDLER_CORE_PATH, "createHttpRouteDefinition");

        const pluginsArray = source.getFirstDescendant(node =>
            Node.isArrayLiteralExpression(node)
        ) as ArrayLiteralExpression;

        pluginsArray.addElement(registration);

        await source.save();
    }
});
