// @flow
import React from "react";
import { Editor } from "slate-react";
import { Value } from "slate";
import { getPlugins } from "@webiny/plugins";
import { withPageBuilder } from "@webiny/app-page-builder/context";

class SlateEditor extends React.Component<*, *> {
    constructor(props) {
        super();

        this.plugins = getPlugins("pb-render-slate-editor").map(pl => pl.slate);

        this.state = {
            value: Value.fromJSON(props.value)
        };
    }

    render() {
        return (
            <Editor
                readOnly={true}
                autoCorrect={false}
                spellCheck={false}
                plugins={this.plugins}
                value={this.state.value}
                theme={this.props.pageBuilder.theme}
            />
        );
    }
}

export default withPageBuilder()(SlateEditor);
