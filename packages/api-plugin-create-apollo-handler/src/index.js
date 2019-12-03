import { ApolloServer } from "apollo-server-lambda";

function toBool(value) {
    if (typeof value === "string") {
        return value === "true";
    }

    return Boolean(value);
}

function normalizeEvent(event) {
    // In AWS, when enabling binary support, received body gets base64 encoded. Did not find a way to solve this
    // correctly, so for now we "normalize" the event before passing it to the handler. It would be nice if
    // we could resolve this issue better / smarter in the future (configure integrations correctly?).
    if (event.isBase64Encoded) {
        event.body = Buffer.from(event.body, "base64").toString("utf-8");
    }
}

export default (options = {}) => {
    return {
        name: "create-apollo-handler",
        type: "create-apollo-handler",
        async create({ plugins, schema }) {
            const { introspection, playground, ...server } = options.server || {};

            const apollo = new ApolloServer({
                introspection: toBool(introspection),
                playground: toBool(playground),
                ...server,
                schema,
                context: async ({ event }) => ({
                    event,
                    plugins
                })
            });

            const handler = apollo.createHandler({
                cors: {
                    origin: "*",
                    methods: "GET,HEAD,POST",
                    ...(options.cors || {})
                }
            });

            return (event, context) => {
                normalizeEvent(event);
                return new Promise((resolve, reject) => {
                    handler(event, context, (error, data) => {
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
