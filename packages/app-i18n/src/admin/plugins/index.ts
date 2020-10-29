import i18nSitePlugins from "@webiny/app-i18n/site/plugins";
import { AdminGlobalSearchPreventHotkeyPlugin } from "@webiny/app-admin/types";
import routes from "./routes";
import menus from "./menus";
import richTextEditor from "./richTextEditor";
import localeSelector from "./localeSelector";
import install from "./install";
import permissionRenderer from "./permissionRenderer";
import apolloLink from "./apolloLink";
import localeTypes from "./localeTypes";

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

export default () => [
    routes,
    menus,
    localeSelector,
    permissionRenderer,
    richTextEditor,
    i18nSitePlugins(),
    globalSearchHotkey,
    install,
    apolloLink,
    localeTypes
];
