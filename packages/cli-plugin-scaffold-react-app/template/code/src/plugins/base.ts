import { imagePlugin } from "@webiny/app/plugins";
import fileManagerPlugins from "@webiny/app-file-manager/admin/plugins";
import fileStorageS3Plugin from "@webiny/app-file-manager-s3";

export default [
    /**
     * Implements the file upload process.
     */
    fileStorageS3Plugin(),
    /**
     * Used by the <Image> component, generates the correct image URL based on requested image size.
     */
    imagePlugin(),
    /**
     * FileManager app plugins
     */
    fileManagerPlugins()
];
