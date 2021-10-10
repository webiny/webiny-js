import { PluginCollection } from "@webiny/plugins/types";
import { globalSearchUsers } from "./globalSearch";
import routes from "./routes";
import menus from "./menus";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";

export default (): PluginCollection => [
    globalSearchUsers,
    routes,
    menus,
    installation,
    permissionRenderer
];
