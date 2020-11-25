import { PluginsAtomPluginParamsType } from "@webiny/app-page-builder/editor/recoil/modules";

export type TogglePluginActionArgsType = {
    name: string;
    params?: PluginsAtomPluginParamsType;
    closeOtherInGroup?: boolean;
};
