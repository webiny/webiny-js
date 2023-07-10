import { plugins } from "@webiny/plugins";
import pageBuilderPlugins from "./pageBuilder";
import formBuilderPlugins from "./formBuilder";
import headlessCmsPlugins from "./headlessCms";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./scaffolds";
import projectPlugins from "../../../../../plugins/admin";

// @ts-ignore
const projectLegacyPlugins = projectPlugins()
    // @ts-ignore
    .props.children.filter(component => typeof component.type.createLegacyPlugin === "function")
    // @ts-ignore
    .map(component => component.type.createLegacyPlugin(component.props));

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
    /**
     * Plugins created via scaffolding utilities.
     */
    scaffoldsPlugins(),

    projectLegacyPlugins
]);
