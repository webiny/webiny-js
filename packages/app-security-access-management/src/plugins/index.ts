import { PluginCollection } from "@webiny/plugins/types";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";
import secureRouteError from "~/plugins/secureRouteError";

export default (): PluginCollection => [installation, permissionRenderer, secureRouteError];
