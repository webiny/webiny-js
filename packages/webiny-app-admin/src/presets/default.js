//@flow
// Layout plugins
import Header from "webiny-app-admin/plugins/Header";
import Footer from "webiny-app-admin/plugins/Footer";
import Content from "webiny-app-admin/plugins/Content";
import snackbar from "webiny-app-admin/plugins/Snackbar";
import topProgressBar from "webiny-app-admin/plugins/TopProgressBar";

// Header plugins
import Menu from "webiny-app-admin/plugins/Menu";
import Logo from "webiny-app-admin/plugins/Logo";
import UserMenu from "webiny-app-admin/plugins/UserMenu";
//import SearchBar from "webiny-app-admin/plugins/SearchBar";

// User menu plugins
import UserInfo from "webiny-app-admin/plugins/UserMenu/plugins/UserInfo";
import UserImage from "webiny-app-admin/plugins/UserMenu/plugins/UserImage";
//import DarkMode from "webiny-app-admin/plugins/UserMenu/plugins/DarkMode";
import Help from "webiny-app-admin/plugins/UserMenu/plugins/Help";
import SendFeedback from "webiny-app-admin/plugins/UserMenu/plugins/Feedback";
import SignOut from "webiny-app-admin/plugins/UserMenu/plugins/SignOut";
import createDivider from "webiny-app-admin/plugins/UserMenu/plugins/Divider";

export default [
    // Layout plugins
    Header,
    Content,
    topProgressBar("layout"),
    topProgressBar("empty-layout"),
    snackbar("layout"),
    snackbar("empty-layout"),
    Footer,
    // Header plugins
    Menu,
    Logo,
    //UserMenu, TODO
    //SearchBar, TODO
    // UserMenu plugins
    UserImage,
    UserInfo,
    // DarkMode,TODO
    Help,
    SendFeedback,
    createDivider(),
    SignOut
];
