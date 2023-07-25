import { plugins } from "@webiny/plugins";
import pageBuilderPlugins from "./pageBuilder";
import formBuilderPlugins from "./formBuilder";
import headlessCmsPlugins from "./headlessCms";

export const registerLegacyPlugins = (projectLegacyPlugins: any) => {
    plugins.register([
        /**
         * Page Builder app plugins.
         */
        pageBuilderPlugins,

        /**
         * Form Builder app plugins.
         */
        formBuilderPlugins,
        /**
         * Headless CMS app plugins.
         */
        headlessCmsPlugins,

        projectLegacyPlugins
    ]);
};
