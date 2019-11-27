import { createHandler, PluginsContainer } from "@webiny/api";

let apolloHandler;

export const handler = async (event, context) => {
    if (typeof apolloHandler !== "function") {
        const plugins = new PluginsContainer([]);
        const { handler } = await createHandler({ plugins });
        apolloHandler = handler;

        const wrappers = plugins.byType("apollo-handler-wrapper");
        for (let i = 0; i < wrappers.length; i++) {
            apolloHandler = await wrappers[i].wrap({ handler: apolloHandler, plugins });
        }
    }

    return await apolloHandler(event, context);
};
