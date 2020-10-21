import React from "react";
import DefaultEditorBar from "./DefaultEditorBar";
import {
    activeElementIdSelector,
    pluginsAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

const Bar: React.FC = () => {
    const elementId = useRecoilValue(activeElementIdSelector);
    const editorPlugins = useRecoilValue(pluginsAtom);
    const pluginsByType = plugins.byType<PbEditorBarPlugin>("pb-editor-bar");
    let pluginBar = null;
    console.log(editorPlugins, elementId);
    for (const plugin of pluginsByType) {
        if (plugin.shouldRender({ plugins: editorPlugins, activeElement: elementId })) {
            pluginBar = plugin.render();
            break;
        }
    }
    return (
        <>
            <DefaultEditorBar />
            {pluginBar}
        </>
    );
};
export default React.memo(Bar);
