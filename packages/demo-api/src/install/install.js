// @flow
import config from "./../configs";
import { addPlugin } from "webiny-plugins";
import install from "webiny-install";

import apiPlugins from "webiny-api/install/plugins";
import securityPlugins from "webiny-security/api/install/plugins";
import cmsPlugins from "webiny-api-cms/install/plugins";

addPlugin(...apiPlugins, ...securityPlugins, ...cmsPlugins);

export default async () => install({ config });
