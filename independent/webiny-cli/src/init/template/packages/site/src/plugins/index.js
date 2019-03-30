// @flow
import cmsPlugins from "webiny-app-cms/site/plugins";
import { fileUploadPlugin, imagePlugin } from "webiny-app/plugins";
import cookiePolicyPlugins from "webiny-integration-cookie-policy/plugins/render";
import typeformPlugins from "webiny-integration-typeform/plugins/render";
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/render";
import gtmPlugins from "webiny-integration-google-tag-manager/plugins/render";

const plugins = [
    fileUploadPlugin(),
    imagePlugin,
    cmsPlugins,
    cookiePolicyPlugins,
    typeformPlugins,
    mailchimpPlugins,
    gtmPlugins
];

export default plugins;
