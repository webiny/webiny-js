import config from "./configs";
import { registerPlugins } from "webiny-plugins";
import installer from "webiny-install";

import filesPlugins from "webiny-api-files/install/plugins";
import securityPlugins from "webiny-api-security/install/plugins";
import cmsPlugins from "webiny-api-cms/install/plugins";

registerPlugins(filesPlugins, securityPlugins, cmsPlugins);

export const install = async (context = {}) => {
    await installer({
        ...context,
        config: await config(),
        security: { admin: { email: "admin@webiny.com", password: "12345678" } }
    });
    process.exit();
};
