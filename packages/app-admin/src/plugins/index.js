// @flow
// Layout plug
import Header from "@webiny/app-admin/plugins/Header";
import Footer from "@webiny/app-admin/plugins/Footer";
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

import init from "./init";

export default [
    // Layout plugins
    Header,
    Content,
    snackbar("layout"),
    snackbar("empty-layout"),
    dialog("layout"),
    dialog("empty-layout"),
    Footer,
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
    ...init
];
