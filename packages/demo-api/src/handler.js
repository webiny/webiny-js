// @flow
import { addPlugin } from "webiny-plugins";
import { createHandler } from "webiny-api";
import config from "./configs";

// Plugins from different apps / integrations.
import cmsPlugins from "webiny-api-cms/plugins";

addPlugin(...cmsPlugins);

export const api = createHandler(config);
