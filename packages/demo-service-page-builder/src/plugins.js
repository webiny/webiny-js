// @flow
import apiPlugins from "webiny-api/plugins";
import securityPlugins from "webiny-api-security/plugins/service";
import i18nPlugins from "webiny-api-i18n/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import mailchimpPlugins from "webiny-api-mailchimp";
import gtmPlugins from "webiny-api-google-tag-manager";
import cookiePolicyPlugins from "webiny-api-cookie-policy";

export default [
    apiPlugins,
    securityPlugins,
    i18nPlugins,
    cmsPlugins,
    mailchimpPlugins,
    gtmPlugins,
    cookiePolicyPlugins
];
