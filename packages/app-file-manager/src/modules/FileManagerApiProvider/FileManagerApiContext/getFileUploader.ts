import { plugins } from "@webiny/plugins";
import { FileUploaderPlugin } from "@webiny/app/types";

export const getFileUploader = (): FileUploaderPlugin => {
    const fileStoragePlugin = plugins.byName<FileUploaderPlugin>("file-uploader");

    if (!fileStoragePlugin) {
        throw Error('Missing plugin: "file-uploader".');
    }

    return fileStoragePlugin;
};
