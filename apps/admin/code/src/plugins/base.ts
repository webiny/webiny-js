import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import fileManagerPlugins from "@webiny/app-file-manager/admin";

export default [
    /**
     * Implements the file upload process.
     */
    fileUploadPlugin(),
    /**
     * Used by the <Image> component, generates the correct image URL based on requested image size.
     */
    imagePlugin(),
    /**
     * FileManager settings module to control file size limits.
     */
    fileManagerPlugins()
];
