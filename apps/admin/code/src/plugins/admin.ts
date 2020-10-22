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
    // This plugin renders admin app layout when <AdminLayout> component is mounted.
    adminLayout,
    // This plugin renders a snackbar container to be used with useSnackbar() hook.
    snackbar,
    // This plugin renders a dialog container to be used with useDialog() hook.
    dialog,
    // Header plugins
    menu,
    logo,
    fileManager,
    userMenu,
    globalSearch,
    globalSearchHotkey,
    // User menu plugins
    darkMode,
    defaultHandle,
    help,
    sendFeedback,
    settingsMenu
];
