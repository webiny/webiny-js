import { AdminGlobalSearchPreventHotkeyPlugin } from "@webiny/app-admin/types";
import install from "@webiny/app-i18n/admin/plugins/install";
import routes from "@webiny/app-i18n/admin/plugins/routes";
import menus from "@webiny/app-i18n/admin/plugins/menus";
import richTextEditor from "@webiny/app-i18n/admin/plugins/richTextEditor";
// I18N site plugins
// TODO: Check why the site plugin is needed in "admin" app
import i18nSitePlugins from "@webiny/app-i18n/site/plugins";

/**
 * Prevents opening global search menu when pressing "/" inside of I18N Rich Text Editor.
 * @type {{shouldOpen(*): boolean, name: string, type: string}}
 */
const globalSearchHotkey: AdminGlobalSearchPreventHotkeyPlugin = {
    type: "admin-global-search-prevent-hotkey",
    name: "global-search-prevent-hotkey-slate-editor",
    preventOpen(e) {
        if ((e.target as any).dataset.slateEditor === "true") {
            return true;
        }
    }
};

export default [i18nSitePlugins(), globalSearchHotkey, install, routes, menus, richTextEditor];
