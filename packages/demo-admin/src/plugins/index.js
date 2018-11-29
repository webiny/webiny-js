// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import cookiePolicyPlugins from "webiny-cookie-policy/admin";

export default [fileUploadPlugin, imagePlugin, ...cookiePolicyPlugins];
