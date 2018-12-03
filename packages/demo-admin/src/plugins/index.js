// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import cookiePolicyPlugins from "webiny-cookie-policy/admin";
import googleTagManager from "webiny-google-tag-manager/admin";

export default [fileUploadPlugin, imagePlugin, ...cookiePolicyPlugins, ...googleTagManager];
