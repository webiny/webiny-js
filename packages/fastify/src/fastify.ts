import { PluginCollection } from "@webiny/plugins/types";
import fastify, { FastifyServerOptions } from "fastify";
import { BeforeHandlerPlugin, ContextPlugin, HandlerErrorPlugin } from "@webiny/handler";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { FastifyContext, FastifyContextRoutes, RouteMethodOptions, RouteTypes } from "~/types";
import { Context } from "~/plugins/Context";
import WebinyError from "@webiny/error";
import { RoutePlugin } from "./plugins/RoutePlugin";
import defaultHandlerClient from "@webiny/handler-client";
import fastifyCookies from "@fastify/cookie";
import { middleware } from "~/middleware";

const DEFAULT_HEADERS: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
    ...getWebinyVersionHeaders()
};

const getDefaultHeaders = (routes: FastifyContextRoutes["defined"]): Record<string, string> => {
    /**
     * If we are accepting all headers, just output that one.
     */
    const keys = Object.keys(routes);
    const all = keys.every(key => routes[key as RouteTypes].length > 0);
    if (all) {
        return {
            ...DEFAULT_HEADERS,
            "Access-Control-Allow-Methods": "*"
        };
    }
    return {
        ...DEFAULT_HEADERS,
        "Access-Control-Allow-Methods": keys
            .filter(key => {
                const type = key as unknown as RouteTypes;
                if (!routes[type] || Array.isArray(routes[type]) === false) {
                    return false;
                }
                return routes[type].length > 0;
            })
            .sort()
            .join(",")
    };
};

const OPTIONS_HEADERS: Record<string, string> = {
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "public, max-age=86400"
};

export interface CreateFastifyHandlerParams {
    plugins: PluginCollection;
    options?: FastifyServerOptions;
}

export const createFastify = (params?: CreateFastifyHandlerParams) => {
    const definedRoutes: FastifyContextRoutes["defined"] = {
        POST: [],
        GET: [],
        OPTIONS: [],
        DELETE: [],
        PATCH: [],
        PUT: [],
        HEAD: []
    };

    const throwOnDefinedRoute = (
        type: RouteTypes | "ALL",
        path: string,
        options?: RouteMethodOptions
    ): void => {
        if (type === "ALL") {
            const all = Object.keys(definedRoutes).some(key => {
                const routes = definedRoutes[key as RouteTypes];
                return routes.includes(path);
            });
            if (!all) {
                return;
            }
            throw new WebinyError(
                `You cannot override a route with onAll() method, please remove unnecessary route from the system.`,
                "OVERRIDE_ROUTE_ERROR",
                {
                    type,
                    path
                }
            );
        } else if (definedRoutes[type].includes(path) === false) {
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

    const addDefinedRoute = (inputType: RouteTypes, path: string): void => {
        const type = (inputType as string).toUpperCase() as RouteTypes;
        if (!definedRoutes[type]) {
            return;
        } else if (definedRoutes[type].includes(path)) {
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
     * We need to register routes in our system so we can output headers later on and dissallow overriding routes.
     */
    app.addHook("onRoute", route => {
        const method = route.method;
        if (Array.isArray(method)) {
            for (const m of method) {
                addDefinedRoute(m, route.path);
            }
            return;
        }
        addDefinedRoute(method, route.path);
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
            throwOnDefinedRoute("POST", path, options);
            app.post(path, handler);
        },
        onGet: (path, handler, options) => {
            throwOnDefinedRoute("GET", path, options);
            app.get(path, handler);
        },
        onOptions: (path, handler, options) => {
            throwOnDefinedRoute("OPTIONS", path, options);
            app.options(path, handler);
        },
        onDelete: (path, handler, options) => {
            throwOnDefinedRoute("DELETE", path, options);
            app.delete(path, handler);
        },
        onPatch: (path, handler, options) => {
            throwOnDefinedRoute("PATCH", path, options);
            app.patch(path, handler);
        },
        onPut: (path, handler, options) => {
            throwOnDefinedRoute("PUT", path, options);
            app.put(path, handler);
        },
        onAll: (path, handler, options) => {
            throwOnDefinedRoute("ALL", path, options);
            app.all(path, handler);
        },
        onHead: (path, handler, options) => {
            throwOnDefinedRoute("HEAD", path, options);
            app.head(path, handler);
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
     * On every request we add default headers, which can be changed later.
     * Also, if it is an options request, we skip everything after this hook and output options headers.
     */
    app.addHook("onRequest", async (request, reply) => {
        const defaultHeaders = getDefaultHeaders(definedRoutes);
        reply.headers(defaultHeaders);
        if (request.method.toLowerCase() !== "options") {
            return;
        }
        const raw = reply.code(204).hijack().raw;
        const headers = { ...defaultHeaders, ...OPTIONS_HEADERS };
        for (const key in headers) {
            raw.setHeader(key, headers[key]);
        }

        raw.end("");
    });

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
        /**
         * By the default we add some headers.
         */
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

        return reply
            .headers({
                "Cache-Control": "no-store"
            })
            .status(500)
            .send(result);
    });

    return app;
};
