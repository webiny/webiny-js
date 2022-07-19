import fastify, { FastifyServerOptions } from "fastify";
import WebinyError from "@webiny/error";
import { ContextPlugin } from "@webiny/handler";
import { FastifyContext, RouteMethodOptions, RouteTypes } from "~/types";
import { RoutePlugin } from "~/plugins/RoutePlugin";

export interface CreateFastifyHandlerParams {
    options?: FastifyServerOptions;
}

export const createFastifyHandler = (params: CreateFastifyHandlerParams) => {
    const server = fastify({
        ...(params.options || {})
    });

    const definedRoutes: Record<RouteTypes, string[]> = {
        post: [],
        get: [],
        options: [],
        delete: [],
        patch: [],
        put: []
    };

    const throwOnDefinedRoute = (
        type: RouteTypes,
        path: string,
        options?: RouteMethodOptions
    ): void => {
        if (definedRoutes[type].includes(path) === false) {
            return;
        } else if (options?.override === true) {
            return;
        }
        throw new WebinyError(
            `When you are trying to override existing route, you must send "override" parameter when adding that route.`,
            "OVERRIDE_ROUTE_ERROR",
            {
                type,
                path
            }
        );
    };

    const addDefinedRoute = (type: RouteTypes, path: string): void => {
        if (definedRoutes[type].includes(path)) {
            return;
        }
        definedRoutes[type].push(path);
    };

    return new ContextPlugin<FastifyContext>(async context => {
        /**
         * This is simplified way of adding new routes.
         * We also check if the route already exists and if it does, is it explicitly overridden.
         *
         */
        context.routes = {
            defined: definedRoutes,
            onPost: (path, handler, options) => {
                throwOnDefinedRoute("post", path, options);
                server.post(path, handler);
                addDefinedRoute("post", path);
            },
            onGet: (path, handler, options) => {
                throwOnDefinedRoute("get", path, options);
                server.get(path, handler);
                addDefinedRoute("get", path);
            },
            onOptions: (path, handler, options) => {
                throwOnDefinedRoute("options", path, options);
                server.options(path, handler);
                addDefinedRoute("options", path);
            },
            onDelete: (path, handler, options) => {
                throwOnDefinedRoute("delete", path, options);
                server.delete(path, handler);
                addDefinedRoute("delete", path);
            },
            onPatch: (path, handler, options) => {
                throwOnDefinedRoute("patch", path, options);
                server.patch(path, handler);
                addDefinedRoute("patch", path);
            },
            onPut: (path, handler, options) => {
                throwOnDefinedRoute("put", path, options);
                server.put(path, handler);
                addDefinedRoute("put", path);
            }
        };

        context.server = server;

        const routes = context.plugins.byType<RoutePlugin>(RoutePlugin.type);
        for (const route of routes) {
            await route.attach(context);
        }
    });
};
