import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPlugins } from "@webiny/plugins";
import { getUi } from "@webiny/app-page-builder/editor/selectors";
import DefaultEditorBar from "./DefaultEditorBar";
import { PbEditorBarPlugin } from "@webiny/app-page-builder/types";

export type EditorBarProps = {
    plugins: { [group: string]: { [name: string]: any } };
    activeElement: any;
};

const Bar: React.FC<EditorBarProps> = props => {
    const plugins = getPlugins("pb-editor-bar") as PbEditorBarPlugin[];
    let pluginBar = null;

    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        if (plugin.shouldRender(props)) {
            pluginBar = plugin.render();
            break;
        }
    }

    return (
        <React.Fragment>
            <DefaultEditorBar />
            {pluginBar}
        </React.Fragment>
    );
};

const stateToProps = state => {
    return { ...getUi(state) };
};

export default connect<any, any, any>(stateToProps)(React.memo(Bar));
