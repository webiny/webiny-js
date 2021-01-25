import { CreateElementEventActionCallableType } from "@webiny/app-page-builder/editor/recoil/actions/createElement/types";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

export const advancedSettingsEditorAction: CreateElementEventActionCallableType = (
    state,
    meta,
    { element, source }
) => {
    // Check the source of the element (could be `saved` element which behaves differently from other elements)
    const sourcePlugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === source.type);
    if (!sourcePlugin) {
        return {};
    }
    const { onCreate: sourceOnCreate } = sourcePlugin;
    if (!sourceOnCreate || sourceOnCreate !== "skip") {
        // If source element does not define a specific `onCreate` behavior - continue with the actual element plugin
        const plugin = plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .find(pl => pl.elementType === element.type);
        if (!plugin) {
            return {};
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
                }
            };
        }
    }
    return {};
};
