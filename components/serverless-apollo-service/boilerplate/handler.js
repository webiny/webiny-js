import { createHandler } from "@webiny/api";
import { PluginsContainer } from "@webiny/plugins";

let apolloHandler;

export const handler = async (event, context) => {
    try {
        if (!apolloHandler) {
            const plugins = new PluginsContainer([]);
            const { handler } = await createHandler({ plugins });
            apolloHandler = handler;
        }

        return apolloHandler(event, context);
    } catch (e) {
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

        console.log("ERROR", report);

        if (process.env.ERROR_REPORTING === "true") {
            return {
                statusCode: 500,
                body: JSON.stringify(report, null, 2)
            };
        }

        throw e;
    }
};
