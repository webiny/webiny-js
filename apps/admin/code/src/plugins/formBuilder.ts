import formBuilderPlugins from "@webiny/app-form-builder/admin/plugins";
import formBuilderPageBuilderPlugins from "@webiny/app-form-builder/page-builder/admin/plugins";

export default [
    /**
     * Form Builder app.
     */
    formBuilderPlugins(),
    /**
     * Plugins to add Forms to your pages using PB Editor.
     */
    formBuilderPageBuilderPlugins(),
];
