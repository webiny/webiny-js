// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";

// TODO remove
import settingsPlugins from "webiny-app-cms/admin/plugins/settings";

export default [fileUploadPlugin, imagePlugin, ...settingsPlugins];
