import React from "react";
import DefaultEditorSideBar from "./DefaultEditorSideBar";
import {
    activeElementIdSelector,
    pluginsAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

const EditorSideBar: React.FC = () => {
    const elementId = useRecoilValue(activeElementIdSelector);
    const editorPlugins = useRecoilValue(pluginsAtom);
    // TODO: May be use `byName` and get "pb-editor-element-settings-side-bar"
    const pluginsByType = plugins.byType<PbEditorBarPlugin>("pb-editor-bar");
    let shouldRenderSettings = false;
    for (const plugin of pluginsByType) {
        if (
            plugin.name === "pb-editor-element-settings-bar" &&
            plugin.shouldRender({ plugins: editorPlugins, activeElement: elementId })
        ) {
            shouldRenderSettings = true;
            break;
        }
    }

    return (
        <>
            <DefaultEditorSideBar shouldRenderSettings={shouldRenderSettings} />
        </>
    );
};
export default React.memo(EditorSideBar);
