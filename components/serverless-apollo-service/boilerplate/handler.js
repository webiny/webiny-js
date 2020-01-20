import { createHandler } from "@webiny/api";
import { PluginsContainer } from "@webiny/plugins";
import "source-map-support/register";

let apolloHandler;

export const handler = async (event, context) => {
    try {
        if (!apolloHandler) {
            const plugins = new PluginsContainer([]);
            const { handler } = await createHandler({ plugins });
            apolloHandler = handler;
        }

        return await apolloHandler(event, context);
    } catch (e) {
        console.log("APOLLO_SERVICE HANDLER", JSON.stringify(e, null, 2));
        const { identity, ...requestContext } = event.requestContext;

        const report = {
            requestContext,
            context,
            error: {
                name: e.constructor.name,
                message: e.message,
                stack: e.stack
            }
        };

        if (process.env.ERROR_REPORTING === "true") {
            return {
                statusCode: 500,
                body: JSON.stringify(report, null, 2)
            };
        }

        throw e;
    }
};
