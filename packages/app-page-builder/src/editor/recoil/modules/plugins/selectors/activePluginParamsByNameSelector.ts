import { plugins } from "@webiny/plugins";
import { selectorFamily } from "recoil";
import { pluginsAtom, PluginsAtomPluginParamsType } from "../..";

export const activePluginParamsByNameSelector = selectorFamily<
    PluginsAtomPluginParamsType | null,
    string
>({
    key: "activePluginParamsByNameSelector",
    get: (name: string) => {
        return ({ get }) => {
            const pl = plugins.byName(name);
            if (!pl) {
                return null;
            }
            const { type } = pl;
            if (!type) {
                return null;
            }
            const pluginsAtomValue = get(pluginsAtom);
            const pluginsByType = pluginsAtomValue[type] || [];
            const activePlugin = pluginsByType.find(pl => pl.name === name);
            if (!activePlugin) {
                return null;
            }
            return activePlugin.params || null;
        };
    }
});
