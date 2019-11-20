// @flow
import { applyMiddleware } from "graphql-middleware";
import { addSchemaLevelResolveFunction } from "graphql-tools";
import type { PluginsContainerType, GraphQLMiddlewarePluginType } from "@webiny/api/types";
import { prepareSchema } from "./graphql/prepareSchema";

export type CreateHandlerParamsType = {
    plugins: PluginsContainerType
};

/**
 * Create Apollo handler
 * @param plugins
 * @returns {Promise<{schema: void, handler(Object, Object): Promise<Object>}|Promise<*>>}
 */
export const createHandler = async ({ plugins }: CreateHandlerParamsType) => {
    const schema = await createSchema({ plugins });

    const plugin = plugins.byName("create-apollo-handler");

    if (!plugin) {
        throw Error(`"create-apollo-handler" plugin is not configured!`);
    }

    const handler = await plugin.create({ plugins, schema });

    return { schema, handler };
};

/**
 * Create graphql schema only
 * @param plugins
 * @returns {Promise<void>}
 */
export const createSchema = async ({ plugins }: CreateHandlerParamsType) => {
    let schema = await prepareSchema({ plugins });

    const registeredMiddleware: Array<GraphQLMiddlewarePluginType> = [];

    const middlewarePlugins = plugins.byType("graphql-middleware");
    for (let i = 0; i < middlewarePlugins.length; i++) {
        let plugin = middlewarePlugins[i];
        const middleware =
            typeof plugin.middleware === "function"
                ? await plugin.middleware({ plugins })
                : plugin.middleware;
        if (Array.isArray(middleware)) {
            registeredMiddleware.push(...middleware);
        } else {
            registeredMiddleware.push(middleware);
        }
    }

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

    return schema;
};
