import { PluginCollection } from "@webiny/plugins/types";
import { globalSearchUsers } from "./globalSearch";
import routes from "./routes";
import menus from "./menus";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";
import cognito, { Options } from "~/cognito";

export type Config = Options;

export default (config: Config): PluginCollection => [
    globalSearchUsers,
    routes,
    menus,
    installation,
    permissionRenderer,
    cognito(config)
];
