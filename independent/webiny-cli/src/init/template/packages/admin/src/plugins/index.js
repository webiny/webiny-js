// @flow
import cmsPlugins from "webiny-app-cms/site/plugins";
import { fileUploadPlugin, imagePlugin } from "webiny-app/plugins";
import cookiePolicyPlugins from "webiny-integration-cookie-policy/plugins/admin";
import typeformPlugins from "webiny-integration-typeform/plugins/render";
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/render";
import gtmPlugins from "webiny-integration-google-tag-manager/plugins/render";

const plugins = [
    fileUploadPlugin,
    imagePlugin,
    cmsPlugins,
    cookiePolicyPlugins,
    typeformPlugins,
    mailchimpPlugins,
    gtmPlugins
];

if (process.env.NODE_ENV !== "development") {
    plugins.push(
        fileUploadPlugin({
            webinyCloud: true
        })
    );
} else {
    plugins.push(fileUploadPlugin({}));
}

export default plugins;
