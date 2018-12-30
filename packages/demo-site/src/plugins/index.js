// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import cmsPlugins from "webiny-app-cms/site/plugins";
import cookiePolicyPlugins from "webiny-integration-cookie-policy/plugins/admin";
import typeformPlugins from "webiny-integration-typeform/plugins/render";
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/render";
import gtmPlugins from "webiny-integration-google-tag-manager/plugins/render";

export default [
    fileUploadPlugin,
    imagePlugin,
    cmsPlugins,
    cookiePolicyPlugins,
    typeformPlugins,
    mailchimpPlugins,
    gtmPlugins
];
