import { plugins } from "@webiny/plugins";
import { EventActionCallable, PbEditorPageElementPlugin } from "~/types";
import { AfterDropElementActionArgsType } from "./types";

const elementPluginType = "pb-editor-page-element";

const getElementTypePlugin = (type: string): PbEditorPageElementPlugin => {
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>(elementPluginType);
    const plugin = pluginsByType.find(pl => pl.elementType === type);
    if (!plugin) {
        throw new Error(`There is no plugin in "${elementPluginType}" for element type ${type}`);
    }
    return plugin;
};

export const afterDropElementAction: EventActionCallable<AfterDropElementActionArgsType> = (
    state,
    _,
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const { element } = args;

    const plugin = getElementTypePlugin(element.type);
    if (plugin.onCreate && plugin.onCreate === "open-settings") {
        return {
            actions: []
        };
    }
    if (plugin.onCreate && plugin.onCreate === "skipElementHighlight") {
        return {
            actions: []
        };
    }

    return {
        state: {
            ...state,
            ui: {
                ...state.ui,
                isDragging: false
            },
            activeElement: element.id,
            sidebar: {
                activeTabIndex: 0,
                highlightTab: true
            }
        },
        actions: []
    };
};
