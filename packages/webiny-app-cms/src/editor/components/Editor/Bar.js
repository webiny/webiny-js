import React from "react";
import { connect } from "react-redux";
import { getPlugins } from "webiny-app/plugins";
import DefaultEditorBar from "./DefaultEditorBar";

class Bar extends React.Component {
    render() {
        const plugins = getPlugins("editor-bar");
        let pluginBar = null;

        for (let i = 0; i < plugins.length; i++) {
            const plugin = plugins[i];
            if (plugin.shouldRender({ state: this.props.state })) {
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

const stateToProps = state => ({ state });

export default connect(stateToProps)(Bar);
