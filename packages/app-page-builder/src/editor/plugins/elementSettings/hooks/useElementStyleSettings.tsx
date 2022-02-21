import { useCallback, useEffect } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorPageElementStyleSettingsPlugin } from "~/types";
import { useKeyHandler } from "../../../hooks/useKeyHandler";
import { userElementStyleSettingsPlugins } from "../../../helpers";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";

interface ElementAction {
    plugin: PbEditorPageElementStyleSettingsPlugin;
    options: Record<string, any>;
}
const getElementActions = (plugin: PbEditorPageElementPlugin): ElementAction[] => {
    if (!plugin || !plugin.settings) {
        return [];
    }

    const pluginSettings = [
        ...userElementStyleSettingsPlugins(plugin.elementType),
        ...(plugin.settings as string[])
    ];

    const elementActions: ElementAction[] = pluginSettings.map(pl => {
        if (typeof pl === "string") {
            return { plugin: plugins.byName(pl), options: {} };
        }

        if (Array.isArray(pl)) {
            return { plugin: plugins.byName(pl[0]), options: pl[1] };
        }

        return null;
    });

    return (
        elementActions
            // Eliminate empty plugins
            .filter(pl => {
                return pl && pl.plugin;
            })
            // Eliminate plugins other than "PbEditorPageElementStyleSettingsPlugin".
            .filter(pl => {
                return (
                    pl && pl.plugin && pl.plugin.type === "pb-editor-page-element-style-settings"
                );
            })
            // Eliminate duplicate plugins
            .filter(
                (pl, index, array) =>
                    array.findIndex(item => item.plugin.name === pl.plugin.name) === index
            )
    );
};

const useElementStyleSettings = (): ElementAction[] => {
    const [activeElement, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElement));
    const elementType = element?.type;

    const deactivateElement = useCallback(() => {
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

export default useElementStyleSettings;
