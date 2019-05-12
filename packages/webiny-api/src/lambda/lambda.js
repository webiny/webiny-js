// @flow
import { ApolloServer } from "apollo-server-lambda";
import { applyMiddleware } from "graphql-middleware";
import { addSchemaLevelResolveFunction } from "graphql-tools";
import type { GraphQLMiddlewarePluginType } from "webiny-api/types";
import { prepareSchema, createGraphqlRunner } from "../graphql/schema";
import setup from "./setup";
import { getPlugins } from "webiny-plugins";

const createApolloHandler = async (config: Object) => {
    await setup(config);
    let schema = prepareSchema();

    const registeredMiddleware: Array<GraphQLMiddlewarePluginType> = [];

    const middlewarePlugins = getPlugins("graphql-middleware");
    for (let i = 0; i < middlewarePlugins.length; i++) {
        let plugin = middlewarePlugins[i];
        const middleware =
            typeof plugin.middleware === "function"
                ? await plugin.middleware({ config })
                : plugin.middleware;
        if (Array.isArray(middleware)) {
            registeredMiddleware.push(...middleware);
        } else {
            registeredMiddleware.push(middleware);
        }
    }

    config.middleware && registeredMiddleware.push(config.middleware);

    if (registeredMiddleware.length) {
        schema = applyMiddleware(schema, ...registeredMiddleware);
    }

    addSchemaLevelResolveFunction(schema, async (root, args, context, info) => {
        // Make sure we do not block this resolver from processing subsequent requests!
        // This is something that is baked into the graphql-tools and cannot be avoided another way.
        delete info.operation["__runAtMostOnce"];

        // Process `graphql-context` plugins
        const ctxPlugins = getPlugins("graphql-context");
        for (let i = 0; i < ctxPlugins.length; i++) {
            const ctxPlugin = ctxPlugins[i];
            await ctxPlugin.apply(context);
        }
    });

    const apollo = new ApolloServer({
        ...(config.apollo || {}),
        schema,
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST"
        },
        context: ({ event }) => {
            const ctx: Object = {
                event,
                config
            };

            // Add `runQuery` function to be able to easily run queries against schemas from within a resolver
            ctx.graphql = createGraphqlRunner(schema, ctx);
            return ctx;
        }
    });

    return apollo.createHandler();
};

function getErrorResponse(error: Error & Object) {
    return {
        body: JSON.stringify({
            errors: [{ code: error.code, message: error.message }]
        }),
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        }
    };
}

let handler = {};

export const createHandler = (configFactory: (context: Object) => Promise<Object>) => {
    return async (event: Object, context: Object) => {
        const config = await configFactory(context);
        await setup(config);

        return await new Promise(async (resolve, reject) => {
            const cacheKey =
                config.handler && config.handler.cacheKey ? config.handler.cacheKey : "default";
            if (!handler[cacheKey]) {
                try {
                    handler[cacheKey] = await createApolloHandler(config);
                } catch (e) {
                    if (process.env.NODE_ENV === "development") {
                        console.log(e); // eslint-disable-line
                    }
                    return resolve(getErrorResponse(e));
                }
            }

            handler[cacheKey](event, context, (error, data) => {
                if (error) {
                    return reject(error);
                }

                if (
                    process.env.NODE_ENV !== "production" &&
                    data.headers["Content-Type"] === "application/json"
                ) {
                    data.body = JSON.stringify(JSON.parse(data.body), null, 2);
                }

                data.headers = {
                    ...data.headers,
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": true
                };
                resolve(data);
            });
        });
    };
};
