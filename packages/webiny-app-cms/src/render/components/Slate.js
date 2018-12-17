// @flow
import React from "react";
import { Editor } from "slate-react";
import { Value } from "slate";
import { getPlugins } from "webiny-plugins";
import { withCms } from "webiny-app-cms/context";

class SlateEditor extends React.Component<*, *> {
    plugins: Array<*>;

    constructor(props) {
        super();

        this.plugins = getPlugins("cms-render-slate-editor").map(pl => pl.slate);
        
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
                theme={this.props.cms.theme}
            />
        );
    }
}

export default withCms()(SlateEditor);
