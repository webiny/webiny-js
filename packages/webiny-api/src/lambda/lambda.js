// @flow
import { ApolloServer } from "apollo-server-lambda";
import { applyMiddleware } from "graphql-middleware";
import { addSchemaLevelResolveFunction } from "graphql-tools";
import { Entity } from "webiny-entity";
import type { GraphQLMiddlewarePluginType } from "webiny-api/types";
import { prepareSchema, createGraphqlRunner } from "../graphql/schema";
import { getPlugins } from "webiny-plugins";

export const createHandler = async (config: Object) => {
    await requestSetup(config);

    let schema = await prepareSchema();

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
            if (typeof ctxPlugins[i].preApply === "function") {
                await ctxPlugins[i].preApply(context);
            }
        }

        for (let i = 0; i < ctxPlugins.length; i++) {
            if (typeof ctxPlugins[i].apply === "function") {
                await ctxPlugins[i].apply(context);
            }
        }

        for (let i = 0; i < ctxPlugins.length; i++) {
            if (typeof ctxPlugins[i].postApply === "function") {
                await ctxPlugins[i].postApply(context);
            }
        }
    });

    const apollo = new ApolloServer({
        ...(config.apollo || {}),
        schema,
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST"
        },
        context: async ({ event }) => {
            await requestSetup(config);

            const ctx: Object = {
                event,
                config
            };

            // Add `runQuery` function to be able to easily run queries against schemas from within a resolver
            ctx.graphql = createGraphqlRunner(schema, ctx);
            return ctx;
        }
    });

    const handler = apollo.createHandler();

    return (event: Object, context: Object): Promise<Object> => {
        return new Promise((resolve, reject) => {
            handler(event, context, (error, data) => {
                if (error) {
                    return reject(error);
                }

                resolve(data);
            });
        });
    };
};

const requestSetup = async (config: Object = {}) => {
    // Configure Entity layer
    if (config.entity) {
        Entity.driver = config.entity.driver;
        Entity.crud = config.entity.crud;
    }

    // Check if connection is valid and if Settings table exists - this will tell us if the system is installed.
    if (process.env.NODE_ENV === "development") {
        try {
            await Entity.getDriver().test();
        } catch (e) {
            throw Error(
                `The following error occurred while initializing Entity driver: "${
                    e.message
                }". Did you enter the correct database information?`
            );
        }
    }
};
