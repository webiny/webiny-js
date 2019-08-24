// @flow
import { registerPlugins } from "@webiny/plugins";
import { createHandler as createBaseHandler } from "@webiny/api";
import createConfig from "service-config";
import plugins from "./plugins";

registerPlugins(plugins);

export const handler = async (event: Object, context: Object) => {
    const config = await createConfig();
    const handler = await createBaseHandler(config);
    return handler(event, context);
};
