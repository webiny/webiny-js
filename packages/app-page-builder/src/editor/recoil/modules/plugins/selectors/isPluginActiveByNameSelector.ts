import { selectorFamily } from "recoil";
import { plugins } from "@webiny/plugins";
import { pluginsAtom } from "../pluginsAtom";

export const isPluginActiveSelector = selectorFamily<boolean, string>({
    key: "isPluginActiveSelector",
    get: name => {
        return ({ get }) => {
            const { type } = plugins.byName(name) || {};
            if (!type) {
                return false;
            }
            const activePlugins = get(pluginsAtom);
            const activePluginsByType = activePlugins.get(type);
            if (!activePluginsByType || activePluginsByType.length === 0) {
                return false;
            }
            return activePluginsByType.some(pl => pl.name === name);
        };
    }
});
