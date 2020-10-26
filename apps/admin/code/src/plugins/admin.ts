import fileManager from "@webiny/app-admin/plugins/FileManager";

// Layout plugins
import adminLayout from "@webiny/app-admin/plugins/AdminLayout";
import snackbar from "@webiny/app-admin/plugins/Snackbar";
import dialog from "@webiny/app-admin/plugins/Dialog";

// Header plugins
import menu from "@webiny/app-admin/plugins/Menu";
import logo from "@webiny/app-admin/plugins/Logo";
import userMenu from "@webiny/app-admin/plugins/UserMenu";
import { globalSearch, globalSearchHotkey } from "@webiny/app-admin/plugins/GlobalSearch";

// User menu plugins
import darkMode from "@webiny/app-admin/plugins/UserMenu/plugins/DarkMode";
import defaultHandle from "@webiny/app-admin/plugins/UserMenu/plugins/DefaultHandle";
import help from "@webiny/app-admin/plugins/UserMenu/plugins/Help";
import sendFeedback from "@webiny/app-admin/plugins/UserMenu/plugins/Feedback";
import settingsMenu from "@webiny/app-admin/plugins/settingsMenu";

export default [
    /**
     * Renders admin app layout when <AdminLayout> component is mounted.
     */
    adminLayout,
    /**
     * Renders a snackbar container to be used with useSnackbar() hook.
     */
    snackbar,
    /**
     * Renders a dialog container to be used with useDialog() hook.
     */
    dialog,
    /**
     * Admin app header plugins.
     */
    menu,
    logo,
    fileManager,
    userMenu,
    globalSearch,
    globalSearchHotkey,
    /**
     * User menu plugins
     */
    darkMode,
    defaultHandle,
    help,
    sendFeedback,
    /**
     * A plugin that dynamically generates settings menu items registered by other apps.
     */
    settingsMenu
];
