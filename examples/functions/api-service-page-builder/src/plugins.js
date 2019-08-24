// @flow
import apiPlugins from "@webiny/api/plugins";
import securityPlugins from "@webiny/api-security/plugins/service";
import pageBuilderPlugins from "@webiny/api-page-builder/plugins";
import mailchimpPlugins from "@webiny/api-mailchimp";
import gtmPlugins from "@webiny/api-google-tag-manager";
import cookiePolicyPlugins from "@webiny/api-cookie-policy";
import i18nPlugins from "@webiny/api-i18n/plugins/service";
import fileEntityPlugins from "@webiny/api-files/plugins/entities";

export default [
    apiPlugins,
    securityPlugins,
    i18nPlugins,
    pageBuilderPlugins,
    mailchimpPlugins,
    gtmPlugins,
    cookiePolicyPlugins,
    fileEntityPlugins
];
