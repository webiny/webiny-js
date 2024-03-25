 import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorPageElementSettingsPlugin } from "~/types";
import { userElementSettingsPlugins } from "../../../helpers";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useMemo } from "react";
import {useDeactivateOnEsc} from "~/editor/plugins/elementSettings/hooks/useDeactivateOnEsc";

interface ElementAction {
    plugin: PbEditorPageElementSettingsPlugin;
    options: Record<string, any>;
}
const getElementActions = (plugin?: PbEditorPageElementPlugin): ElementAction[] => {
    if (!plugin || !plugin.settings) {
        return [];
    }

    const pluginSettings: string[] = [
        ...userElementSettingsPlugins(plugin.elementType),
        ...(plugin.settings as string[])
    ];

    const actions = pluginSettings
        .map(pl => {
            if (typeof pl === "string") {
                return {
                    plugin: plugins.byName<PbEditorPageElementSettingsPlugin>(pl),
                    options: {}
                };
            }

            if (Array.isArray(pl)) {
                return {
                    plugin: plugins.byName<PbEditorPageElementSettingsPlugin>(pl[0]),
                    options: pl[1]
                };
            }

            return null;
        })
        .filter(Boolean) as ElementAction[];

    const elementActions = [
        ...actions,
        {
            plugin: plugins.byName<PbEditorPageElementSettingsPlugin>(
                "pb-editor-page-element-settings-save"
            ),
            options: {}
        }
    ] as ElementAction[];

    return (
        elementActions
            // Eliminate empty plugins
            .filter(pl => {
                return pl && pl.plugin;
            })
            // Eliminate duplicate plugins
            .filter((pl, index, array) => {
                return array.findIndex(item => item.plugin.name === pl.plugin.name) === index;
            })
    );
};

export function useElementSettings(): ElementAction[] {
    useDeactivateOnEsc();
    const [element] = useActiveElement();
    const elementType = element ? element.type : undefined;

    const plugin = useMemo(() => {
        return plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .find(pl => pl.elementType === elementType);
    }, [elementType]);

    return getElementActions(plugin);
}
