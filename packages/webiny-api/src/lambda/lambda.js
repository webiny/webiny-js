import { ApolloServer } from "apollo-server-lambda";
import { applyMiddleware } from "graphql-middleware";
import { prepareSchema, createGraphqlRunner } from "../graphql/schema";
import setup from "./setup";
import authenticate from "./authenticate";

const setupHandler = async (config: Object) => {
    await setup(config);
    let { schema, context } = prepareSchema({ ...config });

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

function getErrorResponse(error: Error) {
    return {
        body: JSON.stringify({
            errors: [{ code: error.code, message: error.message }]
        }),
        statusCode: 200,
        headers: { "Content-Type": "application/json" }
    };
}

export const createHandler = (config = {}) => {
    let handler = null;
    return async (event, context) => {
        return new Promise(async (resolve, reject) => {
            if (!handler) {
                try {
                    handler = await setupHandler(config);
                } catch (e) {
                    if (process.env.NODE_ENV === "development") {
                        console.log(e);
                    }
                    return resolve(getErrorResponse(e));
                }
            }

            try {
                await authenticate(config, event, context);
            } catch (error) {
                return resolve(getErrorResponse(error));
            }

            handler(event, context, (error, data) => {
                if (error) {
                    return reject(error);
                }

                if (process.env.NODE_ENV === "development") {
                    config.database.connection.end();
                    data.body = JSON.stringify(JSON.parse(data.body), null, 2);
                }
                resolve(data);
            });
        });
    };
};
