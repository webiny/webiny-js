// @flow
import config from "./../configs";
import { registerPlugins } from "webiny-plugins";
import install from "webiny-install";

import apiPlugins from "webiny-api/install/plugins";
import securityPlugins from "webiny-security/api/install/plugins";
import cmsPlugins from "webiny-api-cms/install/plugins";

registerPlugins(...apiPlugins, ...securityPlugins, ...cmsPlugins);

export default async () => install({ config });
