import { PluginCollection } from "@webiny/plugins/types";
import { globalSearchUsers } from "./globalSearch";
import routes from "./routes";
import menus from "./menus";
import secureRouteError from "./secureRouteError";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";
import getObjectId from "./getObjectId";
import tenancy from "./tenancy";

export default (): PluginCollection => [
    globalSearchUsers,
    routes,
    menus,
    secureRouteError,
    installation,
    permissionRenderer(),
    getObjectId,
    tenancy
];
