// @flow
import apiPlugins from "webiny-api/plugins";
import securityPlugins from "webiny-api-security/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import cookiePolicyPlugins from "webiny-api-cookie-policy";
import gtmPlugins from "webiny-api-google-tag-manager";
import mailchimpPlugins from "webiny-api-mailchimp";

export default [
    apiPlugins,
    securityPlugins,
    cmsPlugins,
    cookiePolicyPlugins,
    gtmPlugins,
    mailchimpPlugins
];
