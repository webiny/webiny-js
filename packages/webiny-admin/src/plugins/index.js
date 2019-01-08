// @flow
// Layout plug
import Header from "webiny-admin/plugins/Header";
import Footer from "webiny-admin/plugins/Footer";
import Content from "webiny-admin/plugins/Content";
import snackbar from "webiny-admin/plugins/Snackbar";
import dialog from "webiny-admin/plugins/Dialog";

// Header plugins
import Menu from "webiny-admin/plugins/Menu";
import Logo from "webiny-admin/plugins/Logo";
import UserMenu from "webiny-admin/plugins/UserMenu";
import { globalSearch } from "webiny-admin/plugins/GlobalSearch";

// User menu plugins
import DarkMode from "webiny-admin/plugins/UserMenu/plugins/DarkMode";
import DefaultHandle from "webiny-admin/plugins/UserMenu/plugins/DefaultHandle";
import Help from "webiny-admin/plugins/UserMenu/plugins/Help";
import SendFeedback from "webiny-admin/plugins/UserMenu/plugins/Feedback";

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
    UserMenu,
    globalSearch,
    DarkMode,
    DefaultHandle,
    Help,
    SendFeedback,
    ...init
];
