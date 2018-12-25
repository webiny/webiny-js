// @flow
import { ApolloServer } from "apollo-server-lambda";
import { applyMiddleware } from "graphql-middleware";
import { prepareSchema, createGraphqlRunner } from "../graphql/schema";
import setup from "./setup";
import { getPlugins } from "webiny-plugins";

const createApolloHandler = async (config: Object) => {
    await setup(config);
    let { schema, context } = prepareSchema();

    schema = config.middleware ? applyMiddleware(schema, ...config.middleware) : schema;

    const apollo = new ApolloServer({
        schema,
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST"
        },
        context: ({ event, context: { token, user } }) => {
            let ctx = {
                event,
                config,
                user,
                token
            };

            ctx = { ...ctx, ...context(ctx) };

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

export const createHandler = (config: Object = {}) => {
    let handler = null;
    return async (event: Object, context: Object) => {
        // This config flag was set because of following issue.
        // Normally, Lambda waits for node's event loop to finish before returning anything via callback.
        // Since the MySQL connection is still running, that would never happen, and nothing would be returned.
        // With this flag set to false, the callback will be immediately called, without waiting for node's
        // event loop to be cleared.
        // See https://www.jeremydaly.com/reuse-database-connections-aws-lambda/ for more details.
        context.callbackWaitsForEmptyEventLoop = false;

        const response = await new Promise(async (resolve, reject) => {
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

            const securityPlugins = getPlugins("security");
            console.log(securityPlugins)
            for (let i = 0; i < securityPlugins.length; i++) {
                let securityPlugin = securityPlugins[i];
                try {
                    console.log('wohoo')
                    await securityPlugin.authenticate(config, event, context);
                } catch (e) {
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

        // From the docs of "serverless-mysql":
        // Once you’ve run all your queries and your serverless function is ready to return data,
        // call the end() method to perform connection management tasks. This will do things like
        // check the current number of connections, clean up zombies, or even disconnect if there
        // are too many connections being used.
        await config.entity.driver.getConnection().end();

        return response;
    };
};
