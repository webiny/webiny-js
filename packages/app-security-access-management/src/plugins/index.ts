import type { PluginCollection } from "@webiny/plugins/types.js";
import permissionRenderer from "./permissionRenderer/index.js";
import secureRouteError from "~/plugins/secureRouteError.js";

export default (): PluginCollection => [permissionRenderer, secureRouteError];
