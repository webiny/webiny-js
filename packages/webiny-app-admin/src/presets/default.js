// @flow
// Layout plug
import Header from "webiny-app-admin/plugins/Header";
import Footer from "webiny-app-admin/plugins/Footer";
import Content from "webiny-app-admin/plugins/Content";
import snackbar from "webiny-app-admin/plugins/Snackbar";
import dialog from "webiny-app-admin/plugins/Dialog";

// Header plugins
import Menu from "webiny-app-admin/plugins/Menu";
import Logo from "webiny-app-admin/plugins/Logo";
import UserMenu from "webiny-app-admin/plugins/UserMenu";
import { globalSearch, globalSearchUsers } from "webiny-app-admin/plugins/GlobalSearch";
import { generalSettings } from "webiny-app-admin/plugins/Settings";

// User menu plugins
import UserInfo from "webiny-app-admin/plugins/UserMenu/plugins/UserInfo";
import UserImage from "webiny-app-admin/plugins/UserMenu/plugins/UserImage";
import DarkMode from "webiny-app-admin/plugins/UserMenu/plugins/DarkMode";
import Help from "webiny-app-admin/plugins/UserMenu/plugins/Help";
import SendFeedback from "webiny-app-admin/plugins/UserMenu/plugins/Feedback";
import SignOut from "webiny-app-admin/plugins/UserMenu/plugins/SignOut";
import createDivider from "webiny-app-admin/plugins/UserMenu/plugins/Divider";

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
    generalSettings,
    globalSearchUsers,
    // UserMenu plugins
    UserImage,
    UserInfo,
    DarkMode,
    Help,
    SendFeedback,
    createDivider(),
    SignOut
];
