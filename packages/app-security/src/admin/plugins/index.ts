import UserMenu from "./UserMenu";
import { globalSearchUsers } from "./GlobalSearch";
import routes from "./routes";
import menus from "./menus";
import secureRouteError from "./secureRouteError";
import installation from "./installation";
import scopesList from "./scopesList";

export default [
    // Layout plugins
    UserMenu,
    globalSearchUsers,
    routes,
    menus,
    scopesList,
    secureRouteError,
    installation
];
