// @flow
import { ApolloServer } from "apollo-server-lambda";
import { applyMiddleware } from "graphql-middleware";
import { addSchemaLevelResolveFunction } from "graphql-tools";
import { Entity } from "@webiny/entity";
import type { PluginsContainerType, GraphQLMiddlewarePluginType } from "@webiny/api/types";
import { prepareSchema } from "./graphql/prepareSchema";

export type CreateHandlerParamsType = {
    plugins: PluginsContainerType,
    config: Object
};

export const createHandler = async ({ config, plugins }: CreateHandlerParamsType) => {
    await requestSetup(config);

    let schema = await prepareSchema({ plugins, config });

    const registeredMiddleware: Array<GraphQLMiddlewarePluginType> = [];

    const middlewarePlugins = plugins.byType("graphql-middleware");
    for (let i = 0; i < middlewarePlugins.length; i++) {
        let plugin = middlewarePlugins[i];
        const middleware =
            typeof plugin.middleware === "function"
                ? await plugin.middleware({ config, plugins })
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
        const ctxPlugins = plugins.byType("graphql-context");
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
    
    const apolloConfig = config.apollo || {};

    const apollo = new ApolloServer({
        ...(config.apollo || {}),
        schema,
        context: async ({ event, context }) => {
            await requestSetup(config);

            const reqContext = {
                event,
                config,
                plugins,
                getDatabase() {
                    return config.database.mongodb;
                }
            };

            if (typeof apolloConfig.context === "function") {
                return await apolloConfig.context({ event, context }, reqContext);
            }

            return reqContext;
        }
    });

    const handler = apollo.createHandler({
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST",
            ...(apolloConfig.cors || {})
        }
    });

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
};
