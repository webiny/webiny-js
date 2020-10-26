// Core Page Builder app plugins.
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";

// Welcome screen widget for Page Builder
import welcomeScreenWidget from "@webiny/app-page-builder/admin/plugins/welcomeScreenWidget";

// Other plugins to extend Page Builder
import cookiePolicyPlugins from "@webiny/app-cookie-policy/admin";
import googleTagManagerPlugins from "@webiny/app-google-tag-manager/admin";
import typeformPlugins from "@webiny/app-typeform/admin";
import mailchimpPlugins from "@webiny/app-mailchimp/admin";

export default [
    pageBuilderPlugins(),
    welcomeScreenWidget,
    cookiePolicyPlugins(),
    googleTagManagerPlugins(),
    typeformPlugins(),
    mailchimpPlugins(),
    /**
     * This plugin is responsible for lazy-loading plugin presets for page builder editor and list views.
     * Since Editor is quite heavy, we don't want to include it in the main app bundle.
     * The tricky part here is that we want developers to be able to customize which plugins are being loaded, so
     * we need this plugin to allow plugin customization while still using code splitting.
     */
    {
        type: "pb-plugins-loader",
        async loadEditorPlugins() {
            return (await import("./pageBuilder/editorPreset")).default;
        },
        async loadRenderPlugins() {
            return (await import("./pageBuilder/renderPreset")).default;
        }
    }
];
