// @flow
import apiPlugins from "webiny-api/plugins";
import securityPlugins from "webiny-api-security/plugins";
import cmsPlugins from "webiny-api-cms/plugins";
import cookiePolicyPlugins from "webiny-integration-cookie-policy/plugins/api";
import gtmPlugins from "webiny-integration-google-tag-manager/plugins/api";
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/api";

export default [
    apiPlugins,
    securityPlugins,
    cmsPlugins,
    cookiePolicyPlugins,
    gtmPlugins,
    mailchimpPlugins
];
