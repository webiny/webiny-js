import { HttpErrorHandlerPlugin } from "@webiny/http-handler/types";
import { createResponse } from "@webiny/http-handler";

const plugin = (): HttpErrorHandlerPlugin => ({
    name: "handler-apollo-gateway-error",
    type: "error-handler",
    canHandle() {
        return true;
    },
    async handle({ args, error }) {
        const [event, context] = args;
        const { identity, ...requestContext } = event.requestContext;

        const report = {
            requestContext,
            context,
            errors: []
        };

        if (error.constructor.name === "ApolloGatewayError") {
            error.errors.forEach(error => report.errors.push(error));
        } else {
            report.errors.push({ name: error.constructor.name, message: error.message });
        }

        if (process.env.DEBUG === "true") {
            return createResponse({
                statusCode: 500,
                type: "application/json",
                body: JSON.stringify(report, null, 2)
            });
        }

        throw error;
    }
});

export default plugin;
