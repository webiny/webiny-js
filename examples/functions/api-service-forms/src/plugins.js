// @flow
import servicePlugins from "webiny-api/plugins/service";
import securityPlugins from "webiny-api-security/plugins/service";
import formsPlugins from "webiny-api-forms/plugins";
import i18nPlugins from "webiny-api-i18n/plugins/service";

export default [servicePlugins, securityPlugins, i18nPlugins, formsPlugins];
