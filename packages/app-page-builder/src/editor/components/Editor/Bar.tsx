import React from "react";
import { editorPluginsAtom, editorUiActiveElementSelector } from "../../recoil/recoil";
import { getPlugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";
import DefaultEditorBar from "./DefaultEditorBar";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

const Bar: React.FC = () => {
    const editorUiActiveElement = useRecoilValue(editorUiActiveElementSelector);
    const editorPlugins = useRecoilValue(editorPluginsAtom);
    const plugins = getPlugins<PbEditorBarPlugin>("pb-editor-bar");
    let pluginBar = null;
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (plugin.shouldRender({ plugins: editorPlugins, activeElement: editorUiActiveElement })) {
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
