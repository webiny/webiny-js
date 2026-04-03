import type { PluginCollection } from "@webiny/plugins/types.js";
import { PluginsContainer } from "@webiny/plugins/types.js";
import type { FastifyInstance, FastifyServerOptions as ServerOptions } from "fastify";
import fastify from "fastify";
import type { MiddlewareCallable } from "@webiny/utils";
import { middleware } from "@webiny/utils";
import type {
    ContextRoutes,
    DefinedContextRoutes,
    HTTPMethods,
    RouteMethodOptions
} from "~/types.js";
import { Context } from "~/Context.js";
import WebinyError from "@webiny/error";
import { RoutePlugin } from "./plugins/RoutePlugin.js";
import fastifyCookie from "@fastify/cookie";
import fastifyCompress from "@fastify/compress";
import { ContextPlugin } from "@webiny/api";
import { BeforeHandlerPlugin } from "./plugins/BeforeHandlerPlugin.js";
import { HandlerResultPlugin } from "./plugins/HandlerResultPlugin.js";
import { HandlerErrorPlugin } from "./plugins/HandlerErrorPlugin.js";
import { ModifyFastifyPlugin } from "~/plugins/ModifyFastifyPlugin.js";
import { HandlerOnRequestPlugin } from "~/plugins/HandlerOnRequestPlugin.js";
import type { StandardHeaders } from "~/ResponseHeaders.js";
import { ResponseHeaders } from "~/ResponseHeaders.js";
import { ModifyResponseHeadersPlugin } from "~/plugins/ModifyResponseHeadersPlugin.js";
import { SetDefaultHeaders } from "./PreHandler/SetDefaultHeaders.js";
import { PreHandler } from "./PreHandler/PreHandler.js";
import { stringifyError } from "./stringifyError.js";
import { ProcessHandlerOnRequestPlugins } from "./PreHandler/ProcessHandlerOnRequestPlugins.js";
import { ProcessContextPlugins } from "./PreHandler/ProcessContextPlugins.js";
import { IfNotOptionsRequest } from "./PreHandler/IfNotOptionsRequest.js";
import { ProcessBeforeHandlerPlugins } from "./PreHandler/ProcessBeforeHandlerPlugins.js";
import { IfOptionsRequest } from "./PreHandler/IfOptionsRequest.js";
import { SendEarlyOptionsResponse } from "./PreHandler/SendEarlyOptionsResponse.js";
import { OnRequestTimeoutPlugin } from "~/plugins/OnRequestTimeoutPlugin.js";
import { OnRequestResponseSendPlugin } from "~/plugins/OnRequestResponseSendPlugin.js";
import { Request } from "./abstractions/Request.js";
import { Reply } from "./abstractions/Reply.js";
import { RegisterFeatures } from "~/PreHandler/RegisterFeatures.js";
import { RegisterFeaturePlugin } from "~/plugins/RegisterFeaturePlugin.js";

const modifyResponseHeaders = (
    app: FastifyInstance,
    request: Request.Interface,
    reply: Reply.Interface
) => {
    const modifyHeaders = app.webiny.plugins.byType<ModifyResponseHeadersPlugin>(
        ModifyResponseHeadersPlugin.type
    );

    const replyHeaders = reply.getHeaders() as StandardHeaders;
    const headers = ResponseHeaders.create(replyHeaders);

    modifyHeaders.forEach(plugin => {
        plugin.modify(request, headers);
    });

    // Exclude 'set-cookie' header to avoid duplication.
    // Cookies are managed by @fastify/cookie and calling reply.headers() with 'set-cookie' duplicates them.
    const headersToSet = headers.getHeaders();
    delete headersToSet["set-cookie"];

    reply.headers(headersToSet);
};

export interface CreateHandlerParams {
    plugins: PluginCollection | PluginsContainer;
    options?: ServerOptions;
    debug?: boolean;
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
        UNLOCK: [],
        REPORT: [],
        MKCALENDAR: []
    };

    const throwOnDefinedRoute = (
        type: HTTPMethods | "ALL",
        path: string,
        options?: RouteMethodOptions
    ): void => {
        if (type === "ALL") {
            const all = Object.keys(definedRoutes).find(k => {
                const key = k.toUpperCase() as HTTPMethods;
                const routes = definedRoutes[key];
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

    const addDefinedRoute = (input: HTTPMethods, path: string): void => {
        const type = input.toUpperCase() as HTTPMethods;
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
        bodyLimit: 536870912, // 512MB
        disableRequestLogging: true,
        allowErrorHandlerOverride: true,
        ...(params.options || {})
    });

    /**
     * We need to register routes in our system to output headers later on, and disallow route overriding.
     */
    app.addHook("onRoute", route => {
        const method = route.method as HTTPMethods | HTTPMethods[];
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

    const plugins = new PluginsContainer([]);
    plugins.merge(params.plugins || []);

    try {
        context = new Context({
            plugins,
            /**
             * Inserted via webpack at build time.
             */
            WEBINY_VERSION: process.env.WEBINY_VERSION as string,
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
     * To prevent Unsupported Media Type errors on OPTIONS requests with a body,
     * we need to have a custom parser
     */
    app.addContentTypeParser(
        "application/json",
        { parseAs: "string", bodyLimit: 1024 * 1024 },
        (req, body, done) => {
            if (req.method === "OPTIONS") {
                done(null, undefined);
                return;
            }

            try {
                const json = typeof body === "string" ? body : body.toString("utf8");
                done(null, JSON.parse(json));
            } catch (err) {
                done(err as Error);
            }
        }
    );

    /**
     * With this we ensure that an undefined request body is not parsed on OPTIONS requests,
     * in case there's a `content-type` header set for whatever reason.
     *
     * @see https://fastify.dev/docs/latest/Reference/ContentTypeParser/#content-type-parser
     */
    app.addHook("onRequest", async request => {
        if (request.method === "OPTIONS" && request.body === undefined) {
            request.headers["content-type"] = undefined;
        }
    });

    /**
     * At this point, request body is properly parsed, and we can execute Webiny business logic.
     * - set default headers
     * - process `HandlerOnRequestPlugin`
     * - if OPTIONS request, exit early
     * - process `ContextPlugin`
     * - process `BeforeHandlerPlugin`
     */
    app.addHook("preHandler", async (request, reply) => {
        app.webiny.request = request;
        app.webiny.reply = reply;

        // Bind request and reply to DI container for runtime access
        if (app.webiny.container) {
            app.webiny.container.registerInstance(Request, request);
            app.webiny.container.registerInstance(Reply, reply);
        }
        /**
         * Default code to 200 - so we do not need to set it again.
         * Usually we set errors manually when we use reply.send.
         */
        reply.code(200);

        const handlerOnRequestPlugins = app.webiny.plugins.byType<HandlerOnRequestPlugin>(
            HandlerOnRequestPlugin.type
        );

        const contextPlugins = app.webiny.plugins.byType<ContextPlugin>(ContextPlugin.type);

        const beforeHandlerPlugins = app.webiny.plugins.byType<BeforeHandlerPlugin>(
            BeforeHandlerPlugin.type
        );

        const modifyHeadersPlugins = app.webiny.plugins.byType<ModifyResponseHeadersPlugin>(
            ModifyResponseHeadersPlugin.type
        );

        const registerFeaturesPlugins = app.webiny.plugins.byType<RegisterFeaturePlugin>(
            RegisterFeaturePlugin.type
        );

        const preHandler = new PreHandler([
            new RegisterFeatures(registerFeaturesPlugins),
            new SetDefaultHeaders(definedRoutes),
            new ProcessHandlerOnRequestPlugins(handlerOnRequestPlugins),
            new IfNotOptionsRequest([
                new ProcessContextPlugins(app.webiny, contextPlugins),
                new ProcessBeforeHandlerPlugins(app.webiny, beforeHandlerPlugins)
            ]),
            new IfOptionsRequest([new SendEarlyOptionsResponse(modifyHeadersPlugins)])
        ]);

        await preHandler.execute(request, reply, app.webiny);
    });

    app.addHook("preSerialization", async (_, __, payload) => {
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
    });

    app.setErrorHandler<WebinyError>(async (error, _, reply) => {
        /**
         * IMPORTANT! Do not send anything if reply was already sent.
         */
        if (reply.sent) {
            console.warn("Reply already sent, cannot send the result (handler:setErrorHandler).");
            return reply;
        }

        if (error.code?.startsWith("Authentication/")) {
            return reply
                .status(401)
                .headers({ "Cache-Control": "no-store" })
                .send(
                    JSON.stringify({
                        message: error.message,
                        code: error.code
                    })
                );
        }

        if (error.code === "Tenancy/TenantDisabled") {
            return reply
                .status(503)
                .headers({ "Cache-Control": "no-store" })
                .send(
                    JSON.stringify({
                        message: error.message,
                        code: error.code
                    })
                );
        }

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
        console.error("Logging error in @webiny/handler");
        try {
            console.error(stringifyError(error));
        } catch (ex) {
            console.warn("Could not stringify error:");
            console.log(error);
            console.error("Stringify error:", ex);
        }
        /**
         * IMPORTANT! Do not send anything if reply was already sent.
         */
        if (!reply.sent) {
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
        } else {
            console.warn("Reply already sent, cannot send the result (handler:addHook:onError).");
        }

        const handler = middleware(
            plugins.map(pl => {
                return (context: Context, error: Error, next: MiddlewareCallable) => {
                    return pl.handle(context, error, next);
                };
            })
        );
        await handler(app.webiny, error);

        return reply;
    });

    /**
     * Apply response headers modifier plugins.
     */
    app.addHook("onSend", async (request, reply, input) => {
        modifyResponseHeaders(app, request, reply);
        const plugins = app.webiny.plugins.byType<OnRequestResponseSendPlugin>(
            OnRequestResponseSendPlugin.type
        );
        let payload = input;
        for (const plugin of plugins) {
            payload = await plugin.exec(request, reply, payload);
        }
        return payload;
    });

    /**
     * We need to output the benchmark results at the end of the request in both response and timeout cases
     */
    app.addHook("onResponse", async () => {
        await context.benchmark.output();
    });

    app.addHook("onTimeout", async (request, reply) => {
        const plugins = app.webiny.plugins.byType<OnRequestTimeoutPlugin>(
            OnRequestTimeoutPlugin.type
        );
        for (const plugin of plugins) {
            await plugin.exec(request, reply);
        }
        await context.benchmark.output();
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

    return app;
};
