import React from "react";
import { connect } from "react-redux";
import { isEqual, pick } from "lodash";
import { getPlugins } from "webiny-app/plugins";
import { getUi } from "webiny-app-cms/editor/selectors";
import DefaultEditorBar from "./DefaultEditorBar";

class Bar extends React.Component {
    render() {
        const plugins = getPlugins("cms-editor-bar");
        let pluginBar = null;

        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.shouldRender()) {
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
    }
}

const stateToProps = state => {
    return { ...getUi(state) };
};

export default connect(stateToProps)(Bar);
