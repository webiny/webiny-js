import { plugins } from "@webiny/plugins";
import { plugins as tenancyPlugins } from "@webiny/app-tenancy";
import pageBuilderPlugins from "./pageBuilder";
import formBuilderPlugins from "./formBuilder";
import headlessCmsPlugins from "./headlessCms";
import theme from "theme";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./scaffolds";

plugins.register([
    /**
     * Tenant installation.
     */
    tenancyPlugins(),
    /**
     * Page Builder app.
     */
    pageBuilderPlugins,
    /**
     * Form Builder app.
     */
    formBuilderPlugins,
    /**
     * Headless CMS app.
     */
    headlessCmsPlugins,
    /**
     * App theme controls page builder and form builder layouts, styles, etc.
     */
    theme(),
    /**
     * Plugins created via scaffolding utilities.
     */
    scaffoldsPlugins()
]);
