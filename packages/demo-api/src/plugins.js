// @flow
import securityPlugins from "webiny-security/api/plugins";
import cmsPlugins from "webiny-api-cms/plugins";

export default [...securityPlugins, ...cmsPlugins];
