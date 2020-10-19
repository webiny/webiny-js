import { PluginCollection } from "@webiny/plugins/types";

// Layout plug
import Header from "@webiny/app-admin/plugins/Header";
import Content from "@webiny/app-admin/plugins/Content";
import snackbar from "@webiny/app-admin/plugins/Snackbar";
import dialog from "@webiny/app-admin/plugins/Dialog";

// Header plugins
import Menu from "@webiny/app-admin/plugins/Menu";
import Logo from "@webiny/app-admin/plugins/Logo";
import FileManager from "@webiny/app-admin/plugins/FileManager";
import UserMenu from "@webiny/app-admin/plugins/UserMenu";
import { globalSearch, globalSearchHotkey } from "@webiny/app-admin/plugins/GlobalSearch";

// User menu plugins
import DarkMode from "@webiny/app-admin/plugins/UserMenu/plugins/DarkMode";
import DefaultHandle from "@webiny/app-admin/plugins/UserMenu/plugins/DefaultHandle";
import Help from "@webiny/app-admin/plugins/UserMenu/plugins/Help";
import SendFeedback from "@webiny/app-admin/plugins/UserMenu/plugins/Feedback";
import install from "@webiny/app-admin/plugins/install";
import slack from "@webiny/app-admin/plugins/Menu/slack";
import source from "@webiny/app-admin/plugins/Menu/source";

import init from "./init";

export default (): PluginCollection => [
    // Layout plugins
    Header,
    Content,
    snackbar("admin-layout-component"),
    dialog("admin-layout-component"),
    // Header plugins
    Menu,
    Logo,
    FileManager,
    UserMenu,
    globalSearch,
    globalSearchHotkey,
    DarkMode,
    DefaultHandle,
    Help,
    SendFeedback,
    install,
    slack,
    source,
    init
];
