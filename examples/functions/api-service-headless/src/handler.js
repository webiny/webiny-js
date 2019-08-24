// @flow
import { registerPlugins } from "@webiny/plugins";
import { createHandler as createBaseHandler } from "@webiny/api";
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";
import headlessPlugins from "@webiny/api-headless/plugins";
import createConfig from "service-config";

registerPlugins(servicePlugins, securityPlugins, headlessPlugins);

/**
 * `createHandler(context)` - function which returns an actual handler function.
 */
export const createHandler = async (context: Object) => {
    const config = await createConfig(context);
    return await createBaseHandler(config);
};
