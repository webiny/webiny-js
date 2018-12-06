// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import typeform from "webiny-typeform/admin/plugins";

export default [fileUploadPlugin, imagePlugin, ...typeform];
