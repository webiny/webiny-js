// @flow
import fileUploadPlugin from "./fileUploadPlugin";
import imagePlugin from "./imagePlugin";
import typeform from "webiny-typeform/admin";

export default [fileUploadPlugin, imagePlugin, ...typeform];
