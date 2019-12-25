import { PluginType } from "@webiny/api/types";

export interface SecurityPlugin extends PluginType {
    authenticate: Function;
}
