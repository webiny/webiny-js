// @flow
import apiPlugins from "webiny-api/plugins";
import securityPlugins from "webiny-api-security/plugins/service";
import i18nPlugins from "webiny-api-i18n/plugins";
import filesPlugins from "webiny-api-files/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import mailchimpPlugins from "webiny-api-mailchimp";


/*
import headlessPlugins from "webiny-api-headless/plugins";
import cookiePolicyPlugins from "webiny-api-cookie-policy";
import gtmPlugins from "webiny-api-google-tag-manager";
*/

export default [
    apiPlugins,
    i18nPlugins,
    filesPlugins,
    //cmsPlugins,
    securityPlugins,
    mailchimpPlugins
    /*
    headlessPlugins,
    cookiePolicyPlugins,
    gtmPlugins,
    */
];
