// @flow
import { addPlugin } from "webiny-api/plugins";
import { createHandler } from "webiny-api";
import config from "./configs";

// Plugins from different apps / integrations.
import cmsPlugins from "webiny-api-cms/plugins";
import plugins from "./plugins";

addPlugin(...cmsPlugins, ...plugins);

export const api = createHandler(config);
