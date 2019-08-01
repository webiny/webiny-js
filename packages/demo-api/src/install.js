import config from "./configs";
import { registerPlugins } from "webiny-plugins";
import installer from "webiny-install";

import filesPlugins from "webiny-api-files/install/plugins";
import securityPlugins from "webiny-api-security/install/plugins";
import cmsPlugins from "webiny-api-cms/install/plugins";
import i18nPlugins from "webiny-api-i18n/install/plugins";

registerPlugins(filesPlugins, securityPlugins, cmsPlugins, i18nPlugins);

export const install = async (context = {}) => {
    await installer({
        ...context,
        config: await config(),
        security: { admin: { email: "admin@webiny.com", password: "12345678" } },
        cms: {
            siteDomain: 'http://localhost:3002'
        },
        i18n: { defaultLocale: "en-US" }
    });
    process.exit();
};
