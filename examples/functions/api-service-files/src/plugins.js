// @flow
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";
import filesPlugins from "@webiny/api-files/plugins";

export default [filesPlugins, servicePlugins, securityPlugins];
