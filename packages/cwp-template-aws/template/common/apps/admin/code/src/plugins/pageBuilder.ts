/* Core Page Builder app plugins */
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";

/* Page builder core config */
import pageBuilderConfig from "@webiny/app-page-builder/editor/plugins/pageBuilderConfig";

/* Welcome screen widget for Page Builder */
import welcomeScreenWidget from "@webiny/app-page-builder/admin/plugins/welcomeScreenWidget";

export default [
    pageBuilderConfig({
        maxEventActionsNesting: 10
    }),
    pageBuilderPlugins(),
    welcomeScreenWidget,
    /**
     * This plugin is responsible for lazy-loading plugin presets for page builder editor and list views.
     * Since Editor is quite heavy, we don't want to include it in the main app bundle.
     * The tricky part here is that we want developers to be able to customize which plugins are being loaded, so
     * we need this plugin to allow plugin customization while still using code splitting.
     */
    {
        type: "pb-plugins-loader",
        async loadEditorPlugins() {
            return (await import("./pageBuilder/editorPlugins")).default;
        },
        async loadRenderPlugins() {
            return (await import("./pageBuilder/renderPlugins")).default;
        }
    }
];
