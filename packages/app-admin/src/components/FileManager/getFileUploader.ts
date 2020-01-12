import { getPlugin } from "@webiny/plugins";
import { FileUploaderPlugin } from "@webiny/app/types";

export default () => {
    const fileUploaderPlugin = getPlugin("file-uploader") as FileUploaderPlugin;
    return fileUploaderPlugin.upload;
};
