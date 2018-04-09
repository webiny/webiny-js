import React from "react";
import { createComponent } from "webiny-app";

class ParagraphWidget extends React.Component {
    render() {
        const { modules: { EditorWidget, Textarea }, value, onChange } = this.props;
        return (
            <EditorWidget {...{ value, onChange }}>
                <Textarea name={"text"} />
            </EditorWidget>
        );
    }
}

export default createComponent(ParagraphWidget, { modules: ["Textarea", "EditorWidget"] });
