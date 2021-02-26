import { PluginsAtomPluginParamsType } from "../../modules";

export type TogglePluginActionArgsType = {
    name: string;
    params?: PluginsAtomPluginParamsType;
    closeOtherInGroup?: boolean;
};
