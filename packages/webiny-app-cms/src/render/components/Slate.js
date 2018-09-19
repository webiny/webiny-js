// @flow
import React from "react";
import { Editor } from "slate-react";
import { Value } from "slate";
import { getPlugins } from "webiny-app/plugins";
import { withTheme } from "webiny-app-cms/theme";

class SlateEditor extends React.Component<*, *> {
    plugins = getPlugins("cms-slate-editor").map(pl => pl.slate);

    state = {
        value: Value.fromJSON(this.props.value)
    };

    render() {
        return (
            <Editor
                readOnly={true}
                autoCorrect={false}
                spellCheck={false}
                plugins={this.plugins}
                value={this.state.value}
                theme={this.props.theme}
            />
        );
    }
}

export default withTheme()(SlateEditor);
