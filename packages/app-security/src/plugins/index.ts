import { PluginCollection } from "@webiny/plugins/types";
import routes from "./routes";
import menus from "./menus";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";

export default (): PluginCollection => [
    routes,
    menus,
    installation,
    permissionRenderer
];
