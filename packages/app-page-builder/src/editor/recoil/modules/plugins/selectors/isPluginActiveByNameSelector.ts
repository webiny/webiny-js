import { selectorFamily } from "recoil";
import { getPlugin } from "@webiny/plugins";
import { pluginsAtom } from "../pluginsAtom";

const getPluginType = (name: string): string => {
    const plugin = getPlugin(name);
    return plugin?.type || null;
};

export const isPluginActiveSelector = selectorFamily<boolean, string>({
    key: "isPluginActiveSelector",
    get: name => {
        return ({ get }) => {
            const type = getPluginType(name);
            if (!type) {
                return false;
            }
            const activePlugins = get(pluginsAtom);
            const pluginsByType = activePlugins.get(type);
            if (!pluginsByType || pluginsByType.length === 0) {
                return false;
            }
            return pluginsByType.some(pl => pl.name === name);
        };
    }
});
