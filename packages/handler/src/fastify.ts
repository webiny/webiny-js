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
    const keys = Object.keys(routes) as HTTPMethods[];
    const all = keys.every(key => routes[key].length > 0);
    if (all) {
        return {
            ...DEFAULT_HEADERS,
            "Access-Control-Allow-Methods": "*"
        };
    }
    return {
        ...DEFAULT_HEADERS,
        "Access-Control-Allow-Methods": keys
            .filter(type => {
                if (!routes[type] || Array.isArray(routes[type]) === false) {
                    return false;
                }
                return routes[type].length > 0;
            })
            .sort()
            .join(",")
    };
};

const stringifyError = (error: Error) => {
    const { name, message, code, stack, data } = error as any;
    return JSON.stringify({
        ...error,
        constructorName: error.constructor?.name || "UnknownError",
        name: name || "No error name",
        message: message || "No error message",
        code: code || "NO_CODE",
        data,
        stack: process.env.DEBUG === "true" ? stack : "Turn on the debug flag to see the stack."
    });
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
            const all = Object.keys(definedRoutes).find(key => {
                const routes = definedRoutes[key as HTTPMethods];
                return routes.includes(path);
            });
            if (!all) {
                return;
            }
            console.error(
                `Error while registering onAll route. One of the routes is already defined.`
            );
            console.error(JSON.stringify(all));
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
        console.error(`Error while trying to override route: [${type}] ${path}`);
        throw new WebinyError(
            `When you are trying to override existing route, you must send "override" parameter when adding that route.`,
            "OVERRIDE_ROUTE_ERROR",
            {
                type,
                path
            }
        );
    };

    const addDefinedRoute = (type: HTTPMethods, path: string): void => {
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
    let context: Context;
    try {
        context = new Context({
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
    } catch (ex) {
        console.error(`Error while constructing the Context.`);
        console.error(stringifyError(ex));
        throw ex;
    }

    /**
     * We are attaching our custom context to webiny variable on the fastify app, so it is accessible everywhere.
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
    let routePluginName: string | undefined;
    try {
        for (const plugin of routePlugins) {
            routePluginName = plugin.name;
            plugin.cb({
                ...app.webiny.routes,
                context: app.webiny
            });
        }
    } catch (ex) {
        console.error(
            `Error while running the "RoutePlugin" ${
                routePluginName ? `(${routePluginName})` : ""
            } plugin in the beginning of the "createHandler" callable.`
        );
        console.error(stringifyError(ex));
        throw ex;
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

        let name: string | undefined;
        try {
            for (const plugin of plugins) {
                name = plugin.name;
                const result = await plugin.exec(request, reply);
                if (result === false) {
                    return;
                }
            }
        } catch (ex) {
            console.error(
                `Error while running the "HandlerOnRequestPlugin" ${
                    name ? `(${name})` : ""
                } plugin in the onRequest hook.`
            );
            console.error(stringifyError(ex));
            throw ex;
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
            console.error(
                JSON.stringify({
                    message: `Output was already sent. Please check custom plugins of type "HandlerOnRequestPlugin".`,
                    explanation:
                        "This error can happen if the user plugin ended the reply, but did not return false as response."
                })
            );
            return;
        }

        reply
            .headers({ ...defaultHeaders, ...OPTIONS_HEADERS })
            .code(204)
            .send("")
            .hijack();
    });

    app.addHook("preParsing", async (request, reply) => {
        app.webiny.request = request;
        app.webiny.reply = reply;
        const plugins = app.webiny.plugins.byType<ContextPlugin>(ContextPlugin.type);
        let name: string | undefined;
        try {
            for (const plugin of plugins) {
                name = plugin.name;
                await plugin.apply(app.webiny);
            }
        } catch (ex) {
            console.error(
                `Error while running the "ContextPlugin" ${
                    name ? `(${name})` : ""
                } plugin in the preParsing hook.`
            );
            console.error(stringifyError(ex));
            throw ex;
        }
    });
    /**
     *
     */
    app.addHook("preHandler", async () => {
        const plugins = app.webiny.plugins.byType<BeforeHandlerPlugin>(BeforeHandlerPlugin.type);
        let name: string | undefined;
        try {
            for (const plugin of plugins) {
                name = plugin.name;
                await plugin.apply(app.webiny);
            }
        } catch (ex) {
            console.error(
                `Error while running the "BeforeHandlerPlugin" ${
                    name ? `(${name})` : ""
                } plugin in the preHandler hook.`
            );
            console.error(stringifyError(ex));
            throw ex;
        }
    });

    /**
     *
     */
    const preSerialization: preSerializationAsyncHookHandler<any> = async (_, __, payload) => {
        const plugins = app.webiny.plugins.byType<HandlerResultPlugin>(HandlerResultPlugin.type);
        let name: string | undefined;
        try {
            for (const plugin of plugins) {
                name = plugin.name;
                await plugin.handle(app.webiny, payload);
            }
        } catch (ex) {
            console.error(
                `Error while running the "HandlerResultPlugin" ${
                    name ? `(${name})` : ""
                } plugin in the preSerialization hook.`
            );
            console.error(stringifyError(ex));
            throw ex;
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
            .send(
                /**
                 * When we are sending the error in the response, we cannot send the whole error object, as it might contain some sensitive data.
                 */
                JSON.stringify({
                    message: error.message,
                    code: error.code,
                    data: error.data
                })
            );
    });

    app.addHook("onError", async (_, reply, error: any) => {
        const plugins = app.webiny.plugins.byType<HandlerErrorPlugin>(HandlerErrorPlugin.type);
        /**
         * Log error to cloud, as these can be extremely annoying to debug!
         */
        console.error("@webiny/handler");
        console.error(stringifyError(error));

        reply
            .status(500)
            .headers({
                "Cache-Control": "no-store"
            })
            .send(
                /**
                 * When we are sending the error in the response, we cannot send the whole error object, as it might contain some sensitive data.
                 */
                JSON.stringify({
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

        return reply;
    });
    /**
     * We need to output the benchmark results at the end of the request in both response and timeout cases
     */
    app.addHook("onResponse", async () => {
        return context.benchmark.output();
    });
    app.addHook("onTimeout", async () => {
        return context.benchmark.output();
    });

    /**
     * With these plugins we give users possibility to do anything they want on our fastify instance.
     */
    const modifyPlugins = app.webiny.plugins.byType<ModifyFastifyPlugin>(ModifyFastifyPlugin.type);

    let modifyFastifyPluginName: string | undefined;
    try {
        for (const plugin of modifyPlugins) {
            modifyFastifyPluginName = plugin.name;
            plugin.modify(app);
        }
    } catch (ex) {
        console.error(
            `Error while running the "ModifyFastifyPlugin" ${
                modifyFastifyPluginName ? `(${modifyFastifyPluginName})` : ""
            } plugin in the end of the "createHandler" callable.`
        );
        console.error(stringifyError(ex));
        throw ex;
    }

    return app;
};
