// @flow

// Header plugins
import UserMenu from "webiny-security/admin/plugins/UserMenu";
import { globalSearchUsers } from "webiny-security/admin/plugins/GlobalSearch";

// User menu plugins
import UserInfo from "webiny-security/admin/plugins/UserMenu/plugins/UserInfo";
import UserImage from "webiny-security/admin/plugins/UserMenu/plugins/UserImage";
import SignOut from "webiny-security/admin/plugins/UserMenu/plugins/SignOut";
import createDivider from "webiny-security/admin/plugins/UserMenu/plugins/Divider";

import routes from "./routes";
import menus from "./menus";

export default [
    // Layout plugins
    UserMenu,
    globalSearchUsers,
    UserImage,
    UserInfo,
    createDivider(),
    SignOut,
    ...routes,
    ...menus
];
