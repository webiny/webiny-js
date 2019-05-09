// @flow
import cmsPlugins from "webiny-app-cms/site/plugins";
import { fileUploadPlugin, imagePlugin } from "webiny-app/plugins";
import cookiePolicyPlugins from "webiny-app-cookie-policy/render";
import typeformPlugins from "webiny-app-typeform/render";
import mailchimpPlugins from "webiny-app-mailchimp/render";
import gtmPlugins from "webiny-app-google-tag-manager/render";

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
