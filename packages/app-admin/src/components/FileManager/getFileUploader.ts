import { getPlugin } from "@webiny/plugins";
import { FileUploaderPlugin } from "@webiny/app/types";

export default () => {
    const fileUploaderPlugin = getPlugin<FileUploaderPlugin>("file-uploader");
    return fileUploaderPlugin.upload;
};
