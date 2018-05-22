import React from "react";
import { createComponent } from "webiny-app";
import WidgetSettingsContainer from "./../../../../components/WidgetSettingsContainer";

class WidgetSettings extends React.Component {
    render() {
        const {
            modules: { Form },
            services: { cms },
            widget,
            onChange
        } = this.props;

        let editorWidget = cms.getEditorWidget(widget.type);

        return (
            <Form
                model={widget.data || {}}
                onChange={onChange}
            >
                {({ model, Bind }) => (
                    React.cloneElement(
                        editorWidget.widget.renderSettings({
                            WidgetSettingsContainer,
                            widget
                        }),
                        {
                            Bind,
                            widget,
                            onChange
                        }
                    )
                )}
            </Form>
        );
    }
}

export default createComponent(WidgetSettings, {
    modules: ["Form"],
    services: ["cms"]
});
