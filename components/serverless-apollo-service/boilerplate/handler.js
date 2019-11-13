import { createHandler, PluginsContainer } from "@webiny/api";

let apolloHandler;

export const handler = async (event, context) => {
    if (!apolloHandler) {
        const plugins = new PluginsContainer([]);
        const { handler } = await createHandler({ plugins });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
