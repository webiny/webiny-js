import { useRef } from "react";
import { plugins } from "@webiny/plugins";
import { type Plugin } from "@webiny/plugins/types";

export function useRegisterLegacyPlugin<TPlugin extends Plugin>(plugin: TPlugin) {
    const pluginRegistered = useRef<boolean>(false);
    if (!pluginRegistered.current) {
        pluginRegistered.current = true;
        plugins.register(plugin);
    }
}
