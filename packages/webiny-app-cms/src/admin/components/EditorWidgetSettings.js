import React from "react";
import { createComponent } from "webiny-app";

class EditorWidgetSettings extends React.Component {
    render() {
        return (
            <webiny-cms-editor-settings-widget>
                {this.props.children}
            </webiny-cms-editor-settings-widget>
        );
    }
}

export default createComponent(EditorWidgetSettings, { modules: [] });
