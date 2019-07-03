// @flow
import apiPlugins from "webiny-api/plugins";
import i18nPlugins from "webiny-api-i18n/plugins";
import securityPlugins from "webiny-api-security/plugins";
import filesPlugins from "webiny-api-files/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import headlessPlugins from "webiny-api-headless/plugins";
import cookiePolicyPlugins from "webiny-api-cookie-policy";
import gtmPlugins from "webiny-api-google-tag-manager";
import mailchimpPlugins from "webiny-api-mailchimp";

export default [
    apiPlugins,
    i18nPlugins,
    securityPlugins,
    filesPlugins,
    cmsPlugins,
    headlessPlugins,
    cookiePolicyPlugins,
    gtmPlugins,
    mailchimpPlugins
];
