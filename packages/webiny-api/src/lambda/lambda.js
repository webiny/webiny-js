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

    // Security plugins are processed in the top-level resolver
    addSchemaLevelResolveFunction(schema, async (root, args, context) => {
        getPlugins("graphql-context").forEach(plugin => {
            plugin.apply(context);
        });

        const securityPlugins = getPlugins("security");
        for (let i = 0; i < securityPlugins.length; i++) {
            await securityPlugins[i].authenticate(context);
        }
    });

    const apollo = new ApolloServer({
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
        headers: { "Content-Type": "application/json" }
    };
}

let handler = null;

export const createHandler = (config: () => Promise<Object>) => {
    return async (event: Object, context: Object) => {
        config = await config();

        return await new Promise(async (resolve, reject) => {
            if (!handler) {
                try {
                    handler = await createApolloHandler(config);
                } catch (e) {
                    if (process.env.NODE_ENV === "development") {
                        console.log(e); // eslint-disable-line
                    }
                    return resolve(getErrorResponse(e));
                }
            }

            handler(event, context, (error, data) => {
                if (error) {
                    return reject(error);
                }

                if (process.env.NODE_ENV === "development") {
                    data.body = JSON.stringify(JSON.parse(data.body), null, 2);
                }

                resolve(data);
            });
        });
    };
};
