import { useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
    activeElementSelector,
    deactivateElementMutation,
    uiAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { useKeyHandler } from "@webiny/app-page-builder/editor/hooks/useKeyHandler";
import { userSettingsPluginsHelper } from "@webiny/app-page-builder/editor/helpers";

const getElementActions = plugin => {
    if (!plugin || !plugin.settings) {
        return [];
    }

    const pluginSettings = [...userSettingsPluginsHelper(plugin.elementType), ...plugin.settings];

    const elementActions = pluginSettings.map(pl => {
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
            // Eliminate plugins other than PbEditorPageElementStyleSettingsPlugin.
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

const useElementStyleSettings = () => {
    const element = useRecoilValue(activeElementSelector);
    const elementType = element?.type;

    const setUiAtomValue = useSetRecoilState(uiAtom);
    const deactivateElement = () => {
        setUiAtomValue(deactivateElementMutation);
    };

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
