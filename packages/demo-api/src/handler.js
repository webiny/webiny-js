// @flow
import { registerPlugins } from "webiny-plugins";
import { createHandler } from "webiny-api";
import cookiePolicyPlugins from "webiny-integration-cookie-policy/plugins/api"
import config from "./configs";
import plugins from "./plugins";

registerPlugins(plugins, cookiePolicyPlugins);

export const api = createHandler(config);
