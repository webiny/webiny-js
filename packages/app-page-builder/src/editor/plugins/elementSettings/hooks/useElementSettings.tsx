import { useEffect, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorPageElementSettingsPlugin } from "~/types";
import { useKeyHandler } from "../../../hooks/useKeyHandler";
import { userElementSettingsPlugins } from "../../../helpers";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";

interface ElementAction {
    plugin: PbEditorPageElementSettingsPlugin;
    options: Record<string, any>;
}
const getElementActions = (plugin: PbEditorPageElementPlugin): ElementAction[] => {
    if (!plugin || !plugin.settings) {
        return [];
    }

    const pluginSettings: string[] = [
        ...userElementSettingsPlugins(plugin.elementType),
        ...(plugin.settings as string[])
    ];

    const actions: ElementAction[] = pluginSettings
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
        .filter(Boolean);

    const elementActions: ElementAction[] = [
        ...actions,
        {
            plugin: plugins.byName<PbEditorPageElementSettingsPlugin>(
                "pb-editor-page-element-settings-save"
            ),
            options: {}
        }
    ];

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

const useElementSettings = (): ElementAction[] => {
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElement));
    const elementType = element ? element.type : undefined;

    const deactivateElement = useCallback(() => {
        3;
        setActiveElementAtomValue(null);
    }, []);

    const { addKeyHandler, removeKeyHandler } = useKeyHandler();

    useEffect(() => {
        addKeyHandler("escape", e => {
            e.preventDefault();
            deactivateElement();
        });
        return () => removeKeyHandler("escape");
    });

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === elementType);

    return getElementActions(plugin);
};

export default useElementSettings;
