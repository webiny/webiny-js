// @flow
debug("START");
import "source-map-support/register";
import { registerPlugins } from "webiny-plugins";
import { createHandler } from "webiny-api";
import { debug } from "webiny-api/lambda/lambda";

import config from "./configs";
import plugins from "./plugins";

registerPlugins(plugins);
export const api = createHandler(config);
