import { plugins } from "@webiny/plugins";
import headlessCmsPlugins from "./headlessCms";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./scaffolds";

plugins.register([
    /**
     * Headless CMS app.
     */
    headlessCmsPlugins,
    /**
     * Plugins created via scaffolding utilities.
     */
    scaffoldsPlugins()
]);
