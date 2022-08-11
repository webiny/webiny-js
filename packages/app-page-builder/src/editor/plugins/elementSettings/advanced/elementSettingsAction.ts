import { CreateElementEventActionCallable } from "~/editor/recoil/actions/createElement/types";
import { PbEditorPageElementPlugin } from "~/types";
import { plugins } from "@webiny/plugins";

export const elementSettingsAction: CreateElementEventActionCallable = (state, _, args) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const { element, source } = args;
    // Check the source of the element (could be `saved` element which behaves differently from other elements)
    const sourcePlugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === source.type);
    if (!sourcePlugin) {
        return {
            actions: []
        };
    }
    const { onCreate: sourceOnCreate } = sourcePlugin;
    if (!sourceOnCreate || sourceOnCreate !== "skip") {
        // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
        const plugin = plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .find(pl => pl.elementType === element.type);
        if (!plugin) {
            return {
                actions: []
            };
        }
        const { onCreate } = plugin;
        if (onCreate && onCreate === "open-settings") {
            return {
                state: {
                    ...state,
                    activeElement: element.id,
                    sidebar: {
                        // Mark "Element" settings tab active in sidebar.
                        activeTabIndex: 1,
                        // Highlight "Element" settings tab in sidebar.
                        highlightTab: true
                    }
                },
                actions: []
            };
        }
    }
    return {
        actions: []
    };
};
