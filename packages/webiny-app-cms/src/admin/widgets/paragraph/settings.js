import React from "react";
import { createComponent } from "webiny-app";

class ParagraphWidgetSettings extends React.Component {
    render() {
        const { EditorWidgetSettings, Select } = this.props;
        return (
            <EditorWidgetSettings>
                <Select name={"align"}>
                    <option value={"left"}>Left</option>
                    <option value={"right"}>Right</option>
                    <option value={"center"}>Center</option>
                    <option value={"justified"}>Justified</option>
                </Select>
            </EditorWidgetSettings>
        );
    }
}

export default createComponent(ParagraphWidgetSettings, {
    modules: ["Select", "EditorWidgetSettings"]
});
