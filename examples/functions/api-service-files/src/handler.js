// @flow
import { registerPlugins } from "@webiny/plugins";
import { createHandler } from "@webiny/api";
import createConfig from "service-config";
import plugins from "./plugins";

registerPlugins(plugins);

export const handler = async (event: Object, context: Object) => {
    const config = await createConfig();
    const apolloHandler = await createHandler(config);
    return apolloHandler(event, context);
};
