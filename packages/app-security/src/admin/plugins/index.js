// @flow
import UserMenu from "./UserMenu";
import { globalSearchUsers } from "./GlobalSearch";
import routes from "./routes";
import menus from "./menus";
import secureRouteError from "./secureRouteError";

export default [
    // Layout plugins
    UserMenu,
    globalSearchUsers,
    routes,
    menus,
    secureRouteError
];
