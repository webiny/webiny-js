import { getPlugin } from "webiny-plugins";
import invariant from "invariant";

export default () => {
    const withFileUploadPlugin = getPlugin("with-file-upload-uploader");

    invariant(
        withFileUploadPlugin,
        `"withFileUpload" component's uploader plugin (type "webiny-file-upload-uploader") not found.`
    );

    return file => {
        return withFileUploadPlugin.upload(file);
    };
};
