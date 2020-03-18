import i18nSitePlugins from "@webiny/app-i18n/site/plugins";
import { GlobalSearchPreventHotkeyPlugin } from "@webiny/app-admin/types";
import routes from "./routes";
import menus from "./menus";
import richTextEditor from "./richTextEditor";
import install from "./install";
import scopesList from "./scopesList";

/**
 * Prevents opening global search menu when pressing "/" inside of I18N Rich Text Editor.
 * @type {{shouldOpen(*): boolean, name: string, type: string}}
 */
const globalSearchHotkey: GlobalSearchPreventHotkeyPlugin = {
    type: "global-search-prevent-hotkey",
    name: "global-search-prevent-hotkey-slate-editor",
    preventOpen(e) {
        if ((e.target as any).dataset.slateEditor === "true") {
            return true;
        }
    }
};

export default [routes, menus, scopesList, richTextEditor, i18nSitePlugins, globalSearchHotkey, install];
