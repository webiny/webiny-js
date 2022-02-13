import { PluginsAtomPluginParamsType } from "../../modules";

export interface TogglePluginActionArgsType {
    name: string;
    params?: PluginsAtomPluginParamsType;
    closeOtherInGroup?: boolean;
}
