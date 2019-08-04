// @flow
import apiPlugins from "webiny-api/plugins";
import securityPlugins from "webiny-api-security/plugins";
import filesPlugins from "webiny-api-files/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import gtmPlugins from "webiny-api-google-tag-manager";
import cookiePolicyPlugins from "webiny-api-cookie-policy";
import mailchimpPlugins from "webiny-api-mailchimp";
import formPlugins from "webiny-api-forms/plugins";
import i18nPlugins from "webiny-api-i18n/plugins";
// import headlessPlugins from "webiny-api-headless/plugins";

export default [
    filesPlugins,
    apiPlugins,
    i18nPlugins,
    securityPlugins,
    cmsPlugins,
    formPlugins,
    // headlessPlugins,
    cookiePolicyPlugins,
    gtmPlugins,
    mailchimpPlugins
];
