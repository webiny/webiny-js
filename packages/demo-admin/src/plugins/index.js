// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import cookiePolicyPlugins from "webiny-cookie-policy/admin";
import googleTagManager from "webiny-google-tag-manager/admin";
import mailchimp from "webiny-mailchimp/admin/plugins";
import typeform from "webiny-typeform/admin/plugins";

export default [
    fileUploadPlugin,
    imagePlugin,
    ...typeform,
    ...mailchimp,
    ...cookiePolicyPlugins,
    ...googleTagManager
];
