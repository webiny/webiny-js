import React from "react";
import DefaultEditorBar from "./DefaultEditorBar";
// import { pluginsAtom } from "~/state";
// import { plugins } from "@webiny/plugins";
// import { useRecoilValue } from "recoil";
// import { PbEditorBarPlugin } from "~/types";
// import { useActiveElementId } from "~/hooks/useActiveElementId";

const Bar: React.FC = () => {
    // const activeElementId = useActiveElementId();
    // const editorPlugins = useRecoilValue(pluginsAtom);
    // const pluginsByType = plugins.byType<PbEditorBarPlugin>("pb-editor-bar");
    // let pluginBar = null;
    // for (const plugin of pluginsByType) {
    //     if (plugin.shouldRender({ plugins: editorPlugins, activeElement: activeElementId })) {
    //         pluginBar = plugin.render();
    //         break;
    //     }
    // }

    return (
        <>
            <DefaultEditorBar />
        </>
    );
};
export default React.memo(Bar);
