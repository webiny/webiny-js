import userMenu from "./userMenu";
import { globalSearchUsers } from "./globalSearch";
import routes from "./routes";
import menus from "./menus";
import secureRouteError from "./secureRouteError";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";
import getObjectId from "./getObjectId";

export default () => [
    userMenu,
    globalSearchUsers,
    routes,
    menus,
    secureRouteError,
    installation,
    permissionRenderer(),
    getObjectId
];
