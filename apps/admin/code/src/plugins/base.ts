import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import fileManagerPlugins from "@webiny/app-file-manager/admin/plugins";

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
     * FileManager app plugins
     */
    fileManagerPlugins()
];
