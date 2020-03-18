import { ApolloHandlerPluginOptions } from "@webiny/api-plugin-create-apollo-handler/types";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";
import { createHandler, PluginsContainer } from "@webiny/api";

const handlers = {};

const getHandler = async (type, environment, options) => {
    const id = `${type}:${environment}`;

    if (!handlers[id]) {
        // Construct a new plugins container per id
        const plugins = new PluginsContainer(options.plugins({ type, environment }));
        const { handler } = await createHandler({ plugins });
        handlers[id] = handler;
    }

    return handlers[id];
};

type HeadlessHandlerOptions = ApolloHandlerPluginOptions & {
    plugins?: (type, environment) => any[];
};

export default (options: HeadlessHandlerOptions = {}): HttpHandlerPlugin => ({
    type: "handler",
    name: "handler-headless",
    canHandle() {
        return true;
    },
    async handle({ args }) {
        const [event, context] = args;

        try {
            const { key } = event.pathParameters;
            const [type, environment = "default"] = key.split("/");

            return (await getHandler(type, environment, options))(event, context);
        } catch (e) {
            console.log("CAUGHT ERROR", JSON.stringify(e, null, 2));
            const { identity, ...requestContext } = event.requestContext;

            const report = {
                requestContext,
                context,
                errors: []
            };

            report.errors.push({ name: e.constructor.name, message: e.message });

            // if (e.constructor.name === "ApolloGatewayError") {
            //     e.errors.forEach(error => report.errors.push(error));
            // } else {
            //     report.errors.push({ name: e.constructor.name, message: e.message });
            // }

            if (process.env.DEBUG === "true") {
                return {
                    statusCode: 500,
                    body: JSON.stringify(report, null, 2)
                };
            }

            throw e;
        }
    }
});
