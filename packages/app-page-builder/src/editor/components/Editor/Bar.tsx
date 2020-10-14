import React from "react";
import DefaultEditorBar from "./DefaultEditorBar";
import {
    activeElementIdSelector,
    pluginsAtom
} from "@webiny/app-page-builder/editor/recoil/modules";
import { getPlugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

const Bar: React.FC = () => {
    const elementId = useRecoilValue(activeElementIdSelector);
    const editorPlugins = useRecoilValue(pluginsAtom);
    const plugins = getPlugins<PbEditorBarPlugin>("pb-editor-bar");
    let pluginBar = null;
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
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
