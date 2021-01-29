import React from "react";
import DefaultEditorBar from "./DefaultEditorBar";
import { activeElementAtom, pluginsAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

const Bar: React.FC = () => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const editorPlugins = useRecoilValue(pluginsAtom);
    const pluginsByType = plugins.byType<PbEditorBarPlugin>("pb-editor-bar");
    let pluginBar = null;
    for (const plugin of pluginsByType) {
        if (plugin.shouldRender({ plugins: editorPlugins, activeElement: activeElementId })) {
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
