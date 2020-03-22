import { ApolloServer } from "apollo-server-lambda";
import { CreateApolloHandlerPlugin } from "./types";
import { boolean } from "boolean";
import { Plugin, PluginsContainer } from "@webiny/plugins/types";
import { GraphQLSchema } from "graphql";

function normalizeEvent(event) {
    // In AWS, when enabling binary support, received body gets base64 encoded. Did not find a way to solve this
    // correctly, so for now we "normalize" the event before passing it to the handler. It would be nice if
    // we could resolve this issue better / smarter in the future (configure integrations correctly?).
    if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, "base64").toString("utf-8");
    }
}

export type CreateSchemaPlugin = Plugin & {
    name: "handler-apollo-server-create-schema";
    type: "handler-apollo-server-create-schema";
    create(params: { plugins: PluginsContainer }): { schema: GraphQLSchema };
};

const plugin: CreateApolloHandlerPlugin = {
    name: "handler-apollo-server-create",
    type: "handler-apollo-server-create",
    async create({ context, options }) {
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

        return {
            schema,
            handler: (event, context) => {
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
    }
};

export default plugin;
