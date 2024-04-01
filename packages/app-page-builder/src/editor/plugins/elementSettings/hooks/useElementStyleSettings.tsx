import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorPageElementStyleSettingsPlugin } from "~/types";
import { userElementStyleSettingsPlugins } from "../../../helpers";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useDeactivateOnEsc } from "~/editor/plugins/elementSettings/hooks/useDeactivateOnEsc";

interface ElementSettings {
    plugin: PbEditorPageElementStyleSettingsPlugin;
    options: Record<string, any>;
}
const getElementSettings = (plugin?: PbEditorPageElementPlugin): ElementSettings[] => {
    if (!plugin || !plugin.settings) {
        return [];
    }

    const pluginSettings = [
        ...userElementStyleSettingsPlugins(plugin.elementType),
        ...(plugin.settings as string[])
    ];

    const elementSettings = pluginSettings
        .map(pl => {
            if (typeof pl === "string") {
                return { plugin: plugins.byName(pl), options: {} };
            }

            if (Array.isArray(pl)) {
                return { plugin: plugins.byName(pl[0]), options: pl[1] };
            }

            return null;
        })
        .filter(Boolean) as ElementSettings[];

    return (
        elementSettings
            // Eliminate empty plugins
            .filter(pl => pl && pl.plugin)
            // Eliminate plugins other than "PbEditorPageElementStyleSettingsPlugin".
            .filter(pl => pl.plugin.type === "pb-editor-page-element-style-settings")
            // Eliminate duplicate plugins
            .filter((pl, index, array) => {
                return array.findIndex(item => item.plugin.name === pl.plugin.name) === index;
            })
    );
};

export const useElementStyleSettings = (): ElementSettings[] => {
    useDeactivateOnEsc();
    const [element] = useActiveElement();
    const elementType = element ? element.type : undefined;

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === elementType);

    return getElementSettings(plugin);
};
