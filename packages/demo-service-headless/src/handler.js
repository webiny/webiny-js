// @flow
import "source-map-support/register";
import { registerPlugins } from "webiny-plugins";
import { createHandler as createBaseHandler } from "webiny-api";
import servicePlugins from "webiny-api/plugins/service";
import headlessPlugins from "webiny-api-headless/plugins";
import createConfig from "./configs";


registerPlugins(servicePlugins, headlessPlugins);

/**
 * `createHandler(context)` - function which returns an actual handler function.
 */
export const createHandler = async (context: Object) => {
    const config = await createConfig(context);
    return await createBaseHandler(config);
};
