import { pluginsAtom } from "../pluginsAtom";
import { getPlugin } from "@webiny/plugins";
import { useRecoilState } from "recoil";

export const deactivatePluginMutation = (name: string): void => {
    const [editorPlugins, setEditorPlugins] = useRecoilState(pluginsAtom);
    const { type } = getPlugin(name) || {};
    if (!type) {
        return;
    }
    const plugins = editorPlugins.get(type);
    if (!plugins || plugins.length === 0) {
        return;
    }
    const filtered = plugins.filter(pl => pl.name !== name);
    if (filtered.length !== plugins.length) {
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
