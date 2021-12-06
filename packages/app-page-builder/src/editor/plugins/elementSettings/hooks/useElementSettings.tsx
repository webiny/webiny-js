import { useEffect, useCallback } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "../../../../types";
import { useKeyHandler } from "../../../hooks/useKeyHandler";
import { userElementSettingsPlugins } from "../../../helpers";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";

const getElementActions = plugin => {
    if (!plugin || !plugin.settings) {
        return [];
    }

    const pluginSettings = [...userElementSettingsPlugins(plugin.elementType), ...plugin.settings];

    const actions = pluginSettings.map(pl => {
        if (typeof pl === "string") {
            return { plugin: plugins.byName(pl), options: {} };
        }

        if (Array.isArray(pl)) {
            return { plugin: plugins.byName(pl[0]), options: pl[1] };
        }

        return null;
    });

    const elementActions = [
        ...actions,
        { plugin: plugins.byName("pb-editor-page-element-settings-save"), options: {} }
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

const useElementSettings = () => {
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
        .byType(PbEditorPageElementPlugin)
        .find(pl => pl.elementType === elementType);

    return getElementActions(plugin);
};

export default useElementSettings;
