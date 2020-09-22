import { boolean } from "boolean";
import { HandlerErrorPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerArgsContext } from "@webiny/handler-args/types";

const plugin = (): HandlerErrorPlugin<HandlerHttpContext, HandlerArgsContext> => ({
    name: "handler-apollo-gateway-error",
    type: "handler-error",
    async handle(context, error) {
        // Previously we had the "requestContext" here, but it's already present in the context, so it was removed.
        const report = {
            context,
            errors: []
        };

        if (error.constructor.name === "ApolloGatewayError") {
            error.errors.forEach(error => report.errors.push(error));
        } else {
            report.errors.push({ name: error.constructor.name, message: error.message });
        }

        if (boolean(process.env.DEBUG)) {
            return context.http.response({
                statusCode: 500,
                body: JSON.stringify(report, null, 2),
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        throw error;
    }
});

export default plugin;
