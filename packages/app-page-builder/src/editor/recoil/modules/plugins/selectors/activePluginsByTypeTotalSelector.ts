import { selectorFamily } from "recoil";
import { pluginsAtom } from "../pluginsAtom";

export const activePluginsByTypeTotalSelector = selectorFamily<number, string>({
    key: "activePluginsByTypeTotalSelector",
    get: type => {
        return ({ get }) => {
            const activePlugins = get(pluginsAtom);
            return (activePlugins.get(type) || []).length;
        };
    }
});
