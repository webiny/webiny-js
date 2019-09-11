// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";
import headlessPlugins from "@webiny/api-headless/plugins";
import createConfig from "service-config";

const plugins = new PluginsContainer([servicePlugins, securityPlugins, headlessPlugins]);

export const handler = async (context: Object) => {
    const config = await createConfig(context);
    return await createHandler({ config, plugins });
};
