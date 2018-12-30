// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import adminPlugins from "webiny-admin/plugins";
import securityPlugins from "webiny-security/admin/plugins";
import cmsPlugins from "webiny-app-cms/admin/plugins";
import cookiePolicyPlugins from "webiny-integration-cookie-policy/plugins/admin";
import googleTagManagerPlugins from "webiny-integration-google-tag-manager/plugins/admin";
import typeformPlugins from "webiny-integration-typeform/plugins/admin";
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/admin";

export default [
    fileUploadPlugin,
    imagePlugin,
    adminPlugins,
    cmsPlugins,
    securityPlugins,
    cookiePolicyPlugins,
    googleTagManagerPlugins,
    typeformPlugins,
    mailchimpPlugins
];
