// @flow
import config from "./../configs";
import { registerPlugins } from "webiny-plugins";
import install from "webiny-install";

import securityPlugins from "webiny-api-security/install/plugins";
import cmsPlugins from "webiny-api-cms/install/plugins";

registerPlugins(securityPlugins, cmsPlugins);

export default async () => {
    await install({
        config: await config(),
        cms: { copyFiles: false },
        security: { admin: { email: "pavel@webiny.com", password: "87654321" } }
    });
    process.exit();
};
