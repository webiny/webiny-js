import { PluginCollection } from "@webiny/plugins/types";
import fastify, { FastifyServerOptions } from "fastify";
import { BeforeHandlerPlugin, ContextPlugin, HandlerErrorPlugin } from "@webiny/handler";
import middleware from "@webiny/handler/middleware";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { FastifyContext, RouteMethodOptions, RouteTypes } from "~/types";
import { Context } from "~/plugins/Context";
import WebinyError from "@webiny/error";
import { RoutePlugin } from "./plugins/RoutePlugin";
import defaultHandlerClient from "@webiny/handler-client";
import fastifyCookies from "@fastify/cookie";

const DEFAULT_HEADERS: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
    ...getWebinyVersionHeaders()
};

export interface CreateFastifyHandlerParams {
    plugins: PluginCollection;
    options?: FastifyServerOptions;
}

export const createFastify = (params?: CreateFastifyHandlerParams) => {
    const definedRoutes: Record<RouteTypes, string[]> = {
        post: [],
        get: [],
        options: [],
        delete: [],
        patch: [],
        put: [],
        all: []
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
    /**
     * We must attach the server to our internal context if we want to have it accessible.
     */
    const app = fastify({
        ...(params?.options || {})
    });
    /**
     *
     */
    app.register(fastifyCookies, {
        parseOptions: {} // options for parsing cookies
    });
    /**
     * Route helpers - mostly for users.
     */
    const routes: FastifyContext["routes"] = {
        defined: definedRoutes,
        onPost: (path, handler, options) => {
            throwOnDefinedRoute("post", path, options);
            app.post(path, handler);
            addDefinedRoute("post", path);
        },
        onGet: (path, handler, options) => {
            throwOnDefinedRoute("get", path, options);
            app.get(path, handler);
            addDefinedRoute("get", path);
        },
        onOptions: (path, handler, options) => {
            throwOnDefinedRoute("options", path, options);
            app.options(path, handler);
            addDefinedRoute("options", path);
        },
        onDelete: (path, handler, options) => {
            throwOnDefinedRoute("delete", path, options);
            app.delete(path, handler);
            addDefinedRoute("delete", path);
        },
        onPatch: (path, handler, options) => {
            throwOnDefinedRoute("patch", path, options);
            app.patch(path, handler);
            addDefinedRoute("patch", path);
        },
        onPut: (path, handler, options) => {
            throwOnDefinedRoute("put", path, options);
            app.put(path, handler);
            addDefinedRoute("put", path);
        },
        onAll: (path, handler, options) => {
            throwOnDefinedRoute("all", path, options);
            app.all(path, handler);
            addDefinedRoute("all", path);
        }
    };
    const context = new Context({
        plugins: [
            /**
             * We must have handlerClient by default.
             * And it must be one of the first context plugins applied.
             */
            defaultHandlerClient(),
            ...(params?.plugins || [])
        ],
        /**
         * Inserted via webpack on build time.
         */
        WEBINY_VERSION: process.env.WEBINY_VERSION as string,
        server: app,
        routes
    });
    /**
     * We are attaching our custom context to webiny variable on the fastify app so it is accessible everywhere
     */
    app.decorate("webiny", context);

    /**
     * Add routes to the system.
     */
    for (const plugin of app.webiny.plugins.byType<RoutePlugin>(RoutePlugin.type)) {
        plugin.cb({
            ...app.webiny.routes,
            context: app.webiny
        });
    }

    app.addHook("preParsing", async request => {
        app.webiny.request = request;
        for (const plugin of app.webiny.plugins.byType(ContextPlugin.type)) {
            const result = await plugin.apply(app.webiny);
            if (!result) {
                continue;
            }
            return result;
        }
    });

    app.addHook("preHandler", async () => {
        for (const plugin of app.webiny.plugins.byType(BeforeHandlerPlugin.type)) {
            await plugin.apply(app.webiny);
        }
    });

    app.addHook("onError", async (_, reply, error) => {
        const plugins = app.webiny.plugins.byType(HandlerErrorPlugin.type);
        // Log error to cloud, as these can be extremely annoying to debug!
        console.log("@webiny/fastify");
        console.log(error);
        const handler = middleware(
            plugins.map(pl => {
                return (context: Context, error: Error, next: Function) => {
                    return pl.handle(context, error, next);
                };
            })
        );
        const result = handler(app.webiny, error);

        reply.statusCode = 500;
        return reply.headers(DEFAULT_HEADERS).send(result);
    });

    return app;
};
