import { createHandler } from "@webiny/api";
import { PluginsContainer } from "@webiny/plugins";

let apolloHandler;

export const handler = async (event, context) => {
    if (!apolloHandler) {
        const plugins = new PluginsContainer([]);
        const { handler } = await createHandler({ plugins });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
