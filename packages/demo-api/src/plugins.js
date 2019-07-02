// @flow
import apiPlugins from "webiny-api/plugins";
import securityPlugins from "webiny-api-security/plugins";
import filesPlugins from "webiny-api-files/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import formPlugins from "webiny-api-forms/plugins";
import cookiePolicyPlugins from "webiny-api-cookie-policy";
import gtmPlugins from "webiny-api-google-tag-manager";
import mailchimpPlugins from "webiny-api-mailchimp";
import i18nPlugins from "webiny-api-i18n/plugins";

export default [
    apiPlugins,
    i18nPlugins,
    securityPlugins,
    filesPlugins,
    cmsPlugins,
    formPlugins,
    cookiePolicyPlugins,
    gtmPlugins,
    mailchimpPlugins
];
