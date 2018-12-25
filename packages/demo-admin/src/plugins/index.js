// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import adminPlugins from "webiny-admin/plugins";
import securityPlugins from "webiny-security/admin/plugins";

export default [fileUploadPlugin, imagePlugin, ...adminPlugins, ...securityPlugins];
