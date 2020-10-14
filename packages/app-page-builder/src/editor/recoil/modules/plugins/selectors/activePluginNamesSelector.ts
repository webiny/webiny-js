import { selectorFamily } from "recoil";
import { pluginsAtom } from "../pluginsAtom";

export const activePluginNamesSelector = selectorFamily<string[], string>({
    key: `activePluginNamesSelector`,
    get: type => {
        return ({ get }) => {
            const activePlugins = get(pluginsAtom);
            const pluginsByType = activePlugins.get(type);
            if (!pluginsByType || pluginsByType.length === 0) {
                return [];
            }
            return pluginsByType.map(p => p.name);
        };
    }
});
