import { PluginCollection } from "@webiny/plugins/types";
import { globalSearchUsers } from "./globalSearch";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";
import cognito from "./cognito";

export default (): PluginCollection => [
    globalSearchUsers,
    installation,
    permissionRenderer,
    cognito()
];
