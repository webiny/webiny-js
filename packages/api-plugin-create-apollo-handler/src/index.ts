import { ApolloServer } from "apollo-server-lambda";
import { CreateApolloHandlerPlugin } from "@webiny/api/types";
import { ApolloHandlerPluginOptions } from "./types";
import { boolean } from "boolean";

function normalizeEvent(event) {
    // In AWS, when enabling binary support, received body gets base64 encoded. Did not find a way to solve this
    // correctly, so for now we "normalize" the event before passing it to the handler. It would be nice if
    // we could resolve this issue better / smarter in the future (configure integrations correctly?).
    if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, "base64").toString("utf-8");
    }
}

export default (options: ApolloHandlerPluginOptions = {}): CreateApolloHandlerPlugin => {
    return {
        name: "create-apollo-handler",
        type: "create-apollo-handler",
        create({ plugins, schema }) {
            const { server = {}, handler = {} } = options;

            const apollo = new ApolloServer({
                introspection: boolean(server.introspection),
                playground: boolean(server.playground),
                debug: boolean(process.env.DEBUG),
                ...server,
                schema,
                context: async ({ event }) => ({
                    event,
                    plugins
                })
            });

            const apolloHandler = apollo.createHandler({
                cors: {
                    origin: "*",
                    methods: "GET,HEAD,POST",
                    ...(handler.cors || {})
                }
            });

            return (event, context) => {
                normalizeEvent(event);
                return new Promise((resolve, reject) => {
                    apolloHandler(event, context, (error, data) => {
                        if (error) {
                            return reject(error);
                        }

                        resolve(data);
                    });
                });
            };
        }
    };
};
