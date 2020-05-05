import { ApolloServer } from "apollo-server-lambda";
import { boolean } from "boolean";
import { CreateSchemaPlugin } from "@webiny/handler-apollo-server/types";
import get from "lodash.get";
import { HandlerContext } from "@webiny/handler/types";

function normalizeEvent(event) {
    // In AWS, when enabling binary support, received body gets base64 encoded. Did not find a way to solve this
    // correctly, so for now we "normalize" the event before passing it to the handler. It would be nice if
    // we could resolve this issue better / smarter in the future (configure integrations correctly?).
    if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, "base64").toString("utf-8");
    }
}

type CreateApolloHandlerParams = {
    context: HandlerContext;
    options: { [key: string]: any };
    meta?: { [key: string]: any };
};

export default async function createApolloHandler({
    context,
    options,
    meta = null
}: CreateApolloHandlerParams) {
    const { server = {}, handler = {} } = options;

    const createSchemaPlugin = context.plugins.byName<CreateSchemaPlugin>(
        "handler-apollo-server-create-schema"
    );

    if (!createSchemaPlugin) {
        throw Error(`"handler-apollo-server-create-schema" plugin is not configured!`);
    }

    const { schema } = await createSchemaPlugin.create({
        plugins: context.plugins
    });

    const apollo = new ApolloServer({
        // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
        introspection: boolean(server.introspection),
        // @ts-ignore Not sure why it doesn't work, "boolean" function does return a boolean value.
        playground: boolean(server.playground),
        debug: boolean(process.env.DEBUG),
        ...server,
        schema,
        context: async ({ event }) => ({
            event,
            plugins: context.plugins
        })
    });

    const apolloHandler = apollo.createHandler({
        cors: {
            origin: "*",
            methods: "GET,HEAD,POST",
            ...(handler.cors || {})
        }
    });

    const output = {
        meta,
        async queryMeta() {
            // Invoke handler and check if environment / environment alias has changed.
            const response = await output.handler(
                {
                    httpMethod: "POST",
                    headers: {},
                    body: JSON.stringify({
                        query: /* GraphQL */ `
                            {
                                getMeta {
                                    cacheKey
                                }
                            }
                        `
                    })
                },
                {}
            );

            const body = JSON.parse(response.body);
            return get(body, "data.getMeta") || {};
        },
        schema,
        handler: (event, context): any => {
            normalizeEvent(event);
            return new Promise((resolve, reject) => {
                apolloHandler(event, context, (error, data) => {
                    if (error) {
                        return reject(error);
                    }

                    resolve(data);
                });
            });
        }
    };

    if (!output.meta) {
        output.meta = await output.queryMeta();
    }

    return output;
}
