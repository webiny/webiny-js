// @flow
import middleware from "./middleware";

export default (namespace: Object, options: Object = {}) => {
    // Route request.
    return async ({ event }: { event: Object }) => {
        // Parse event body if present
        event.body = event.body ? JSON.parse(event.body) : {};

        return namespace.runAndReturn(async () => {
            return (async () => {
                const context = { event };
                namespace.set("context", context);
                return middleware(context)
                    .then(context => ({ output: context.output }))
                    .catch(error => {
                        // Execute `onUncaughtError` callback if configured
                        if (typeof options.onUncaughtError === "function") {
                            return options.onUncaughtError({ error, event });
                        }

                        // If no custom error handler is provided - send error response.
                        return {
                            output: { errors: [{ name: error.name, message: error.message }] },
                            statusCode: error.status || 500
                        };
                    });
            })();
        });
    };
};
