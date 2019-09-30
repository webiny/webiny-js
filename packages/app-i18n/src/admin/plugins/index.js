// @flow
import routes from "./routes";
import menus from "./menus";
import richTextEditor from "./richTextEditor";
import i18nSitePlugins from "@webiny/app-i18n/site/plugins";

/**
 * Prevents opening global search menu when pressing "/" inside of I18N Rich Text Editor.
 * @type {{shouldOpen(*): boolean, name: string, type: string}}
 */
const globalSearchHotkey = {
    type: "global-search-prevent-hotkey",
    name: "global-search-prevent-hotkey-slate-editor",
    preventOpen(e) {
        if (e.target.dataset.slateEditor === "true") {
            return true;
        }
    }
};

export default [routes, menus, richTextEditor, i18nSitePlugins, globalSearchHotkey];
