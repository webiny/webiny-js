import { pluginsAtom } from "../pluginsAtom";
import { plugins } from "@webiny/plugins";
import { useRecoilState } from "recoil";

export const deactivatePluginMutation = (name: string): void => {
    const [editorPlugins, setEditorPlugins] = useRecoilState(pluginsAtom);
    const { type } = plugins.byName(name) || {};
    if (!type) {
        return;
    }
    const allPluginsByType = editorPlugins.get(type);
    if (!allPluginsByType || allPluginsByType.length === 0) {
        return;
    }
    const filtered = allPluginsByType.filter(pl => pl.name !== name);
    if (filtered.length !== allPluginsByType.length) {
        return;
    }
    // TODO verity that it is better to update state via fn instead of object
    setEditorPlugins(state => {
        return {
            ...state,
            [type]: filtered
        };
    });
};
