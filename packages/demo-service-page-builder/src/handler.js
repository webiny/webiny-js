// @flow
import { registerPlugins } from "webiny-plugins";
import { createHandler as createBaseHandler } from "webiny-api";
import createConfig from "demo-service-config";
import plugins from "./plugins";

registerPlugins(plugins);

export const handler = async (event: Object, context: Object) => {
    const config = await createConfig();
    const apolloHandler = await createBaseHandler(config);
    return apolloHandler(event, context);
};