import { plugins } from "@webiny/plugins";
import { EventActionCallable, PbEditorPageElementPlugin } from "../../../../types";
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
    const { element } = args;

    const plugin = getElementTypePlugin(element.type);
    if (plugin.onCreate && plugin.onCreate === "open-settings") {
        return {};
    }
    if (plugin.onCreate && plugin.onCreate === "skipElementHighlight") {
        return {};
    }

    return {
        state: {
            ...state,
            activeElement: element.id,
            sidebar: {
                activeTabIndex: 0,
                highlightTab: true
            }
        }
    };
};
