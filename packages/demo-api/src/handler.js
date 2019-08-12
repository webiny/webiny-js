// @flow
import { registerPlugins } from "webiny-plugins";
import { createHandler as createBaseHandler } from "webiny-api";
import createConfig from "./configs";
import plugins from "./plugins";

registerPlugins(plugins);

/**
 * `createHandler(context)` - function which returns an actual handler function.
 */
export const createHandler = async (context: Object) => {
    const config = await createConfig(context);
    return await createBaseHandler(config);
};