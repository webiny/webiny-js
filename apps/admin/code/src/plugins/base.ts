import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import welcomeScreenPlugins from "@webiny/app-plugin-admin-welcome-screen";
import fileManagerPlugins from "@webiny/app-file-manager/admin";
import adminPlugins from "./admin";

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
     * Complete admin app UI
     */
    adminPlugins,
    /**
     * FileManager settings module to control file size limits.
     */
    fileManagerPlugins(),
    /**
     * Renders a welcome screen with useful links at "/" path.
     */
    welcomeScreenPlugins()
];
