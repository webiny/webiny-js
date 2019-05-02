import { getPlugin } from "webiny-plugins";

export default () => {
    const fileUploaderPlugin = getPlugin("file-uploader");
    return fileUploaderPlugin.upload;
};
