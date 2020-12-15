import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "../../../../types";
import { EventActionCallableType } from "../../eventActions";
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

export const afterDropElementAction: EventActionCallableType<AfterDropElementActionArgsType> = (
    state,
    meta,
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
            ui: {
                ...state.ui,
                sidebarActiveTabIndex: 0,
                highlightElementTab: true,
                activeElement: element.id
            }
        }
    };
};
