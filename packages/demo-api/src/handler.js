// @flow
import { registerPlugins } from "webiny-plugins";
import { createHandler } from "webiny-api";
import config from "./configs";
import plugins from "./plugins";

registerPlugins(...plugins);

export const api = createHandler(config);
