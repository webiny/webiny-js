import { PluginCollection } from "@webiny/plugins/types";
import fastify, {
    FastifyServerOptions as ServerOptions,
    preSerializationAsyncHookHandler
} from "fastify";
import { getWebinyVersionHeaders } from "@webiny/utils";
import { ContextRoutes, DefinedContextRoutes, RouteMethodOptions, HTTPMethods } from "~/types";
import { Context } from "~/Context";
import WebinyError from "@webiny/error";
import { RoutePlugin } from "./plugins/RoutePlugin";
import { createHandlerClient } from "@webiny/handler-client";
import fastifyCookie from "@fastify/cookie";
import fastifyCompress from "@fastify/compress";
import { middleware } from "~/middleware";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "./plugins/BeforeHandlerPlugin";
import { HandlerResultPlugin } from "./plugins/HandlerResultPlugin";
import { HandlerErrorPlugin } from "./plugins/HandlerErrorPlugin";
import { ModifyFastifyPlugin } from "~/plugins/ModifyFastifyPlugin";
import { HandlerOnRequestPlugin } from "~/plugins/HandlerOnRequestPlugin";

const DEFAULT_HEADERS: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,DELETE,PUT,PATCH",
    ...getWebinyVersionHeaders()
};

const getDefaultHeaders = (routes: DefinedContextRoutes): Record<string, string> => {
    /**
     * If we are accepting all headers, just output that one.
     */
    const keys = Object.keys(routes);
    const all = keys.every(key => routes[key as HTTPMethods].length > 0);
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
                const type = key as unknown as HTTPMethods;
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

export interface CreateHandlerParams {
    plugins: PluginCollection;
    options?: ServerOptions;
}

export const createHandler = (params: CreateHandlerParams) => {
    const definedRoutes: DefinedContextRoutes = {
        POST: [],
        GET: [],
        OPTIONS: [],
        DELETE: [],
        PATCH: [],
        PUT: [],
        HEAD: [],
        COPY: [],
        LOCK: [],
        MKCOL: [],
        MOVE: [],
        PROPFIND: [],
        PROPPATCH: [],
        SEARCH: [],
        TRACE: [],
        UNLOCK: []
    };

    const throwOnDefinedRoute = (
        type: HTTPMethods | "ALL",
        path: string,
        options?: RouteMethodOptions
    ): void => {
        if (type === "ALL") {
            const all = Object.keys(definedRoutes).some(key => {
                const routes = definedRoutes[key as HTTPMethods];
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

    const addDefinedRoute = (inputType: HTTPMethods, path: string): void => {
        const type = (inputType as string).toUpperCase() as HTTPMethods;
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
        ...(params.options || {})
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
     * ############################
     * Register the Fastify plugins.
     */
    /**
     * Package @fastify/cookie
     *
     * https://github.com/fastify/fastify-cookie
     */
    app.register(fastifyCookie, {
        parseOptions: {} // options for parsing cookies
    });
    /**
     * Package @fastify/compress
     *
     * https://github.com/fastify/fastify-compress
     */
    app.register(fastifyCompress, {
        global: true,
        threshold: 1024,
        onUnsupportedEncoding: (encoding, _, reply) => {
            reply.code(406);
            return `We do not support the ${encoding} encoding.`;
        },
        inflateIfDeflated: true
    });
    /**
     * Route helpers - mostly for users.
     */
    const routes: ContextRoutes = {
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
            createHandlerClient(),
            ...(params.plugins || [])
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
     * We have few types of triggers:
     *  * Events - EventPlugin
     *  * Routes - RoutePlugin
     *
     * Routes are registered in fastify but events must be handled in package which implements cloud specific methods.
     */
    const routePlugins = app.webiny.plugins.byType<RoutePlugin>(RoutePlugin.type);

    /**
     * Add routes to the system.
     */
    for (const plugin of routePlugins) {
        plugin.cb({
            ...app.webiny.routes,
            context: app.webiny
        });
    }

    /**
     * On every request we add default headers, which can be changed later.
     * Also, if it is an options request, we skip everything after this hook and output options headers.
     */
    app.addHook("onRequest", async (request, reply) => {
        /**
         * Our default headers are always set. Users can override them.
         */
        const defaultHeaders = getDefaultHeaders(definedRoutes);
        reply.headers(defaultHeaders);
        /**
         * Users can define their own custom handlers for the onRequest event - so let's run them first.
         */
        const plugins = app.webiny.plugins.byType<HandlerOnRequestPlugin>(
            HandlerOnRequestPlugin.type
        );
        for (const plugin of plugins) {
            const result = await plugin.exec(request, reply);
            if (result === false) {
                return;
            }
        }
        /**
         * When we receive the OPTIONS request, we end it before it goes any further as there is no need for anything to run after this - at least for our use cases.
         *
         * Users can prevent this by creating their own HandlerOnRequestPlugin and returning false as the result of the callable.
         */
        if (request.method !== "OPTIONS") {
            return;
        }

        if (reply.sent) {
            /**
             * At this point throwing an exception will not do anything with the response. So just log it.
             */
            console.log(
                JSON.stringify({
                    message: `Output was already sent. Please check custom plugins of type "HandlerOnRequestPlugin".`,
                    explanation:
                        "This error can happen if the user plugin ended the reply, but did not return false as response."
                })
            );
            return;
        }
        const raw = reply.code(204).hijack().raw;
        const headers = { ...defaultHeaders, ...OPTIONS_HEADERS };
        for (const key in headers) {
            raw.setHeader(key, headers[key]);
        }

        raw.end("");
    });

    app.addHook("preParsing", async request => {
        app.webiny.request = request;
        const plugins = app.webiny.plugins.byType<ContextPlugin>(ContextPlugin.type);
        for (const plugin of plugins) {
            await plugin.apply(app.webiny);
        }
    });
    /**
     *
     */
    app.addHook("preHandler", async () => {
        const plugins = app.webiny.plugins.byType<BeforeHandlerPlugin>(BeforeHandlerPlugin.type);
        for (const plugin of plugins) {
            await plugin.apply(app.webiny);
        }
    });

    /**
     *
     */
    const preSerialization: preSerializationAsyncHookHandler<any> = async (_, __, payload) => {
        const plugins = app.webiny.plugins.byType<HandlerResultPlugin>(HandlerResultPlugin.type);
        for (const plugin of plugins) {
            await plugin.handle(app.webiny, payload);
        }
        return payload;
    };

    app.addHook("preSerialization", preSerialization);

    app.setErrorHandler<WebinyError>(async (error, request, reply) => {
        return reply
            .status(500)
            .headers({
                "Cache-Control": "no-store"
            })
            .send({
                message: error.message,
                code: error.code,
                data: error.data
            });
    });

    app.addHook("onError", async (_, reply, error: any) => {
        const plugins = app.webiny.plugins.byType<HandlerErrorPlugin>(HandlerErrorPlugin.type);
        /**
         * Log error to cloud, as these can be extremely annoying to debug!
         */
        console.log("@webiny/handler");
        console.log(
            JSON.stringify({
                ...error,
                message: error.message,
                code: error.code,
                data: error.data
            })
        );
        const handler = middleware(
            plugins.map(pl => {
                return (context: Context, error: Error, next: Function) => {
                    return pl.handle(context, error, next);
                };
            })
        );
        await handler(app.webiny, error);

        return reply
            .send({
                message: error.message,
                code: error.code,
                data: error.data
            })
            .headers({
                "Cache-Control": "no-store"
            })
            .status(500);
    });

    /**
     * With these plugins we give users possibility to do anything they want on our fastify instance.
     */
    const modifyPlugins = app.webiny.plugins.byType<ModifyFastifyPlugin>(ModifyFastifyPlugin.type);
    for (const plugin of modifyPlugins) {
        plugin.modify(app);
    }

    return app;
};
