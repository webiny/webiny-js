import React from "react";
import { Component } from "webiny-client";
import { WidgetSettingsContainer } from "webiny-client-cms/lib/admin";

@Component({
    modules: ["Form", "Icon"],
    services: ["cms"]
})
export default class WidgetSettings extends React.Component {
    render() {
        const {
            modules: { Form },
            services: { cms },
            widget,
            onChange
        } = this.props;

        let editorWidget = cms.getEditorWidget(widget.type);

        return (
            <div>
                <Form model={widget.data || {}} onChange={onChange}>
                    {({ model, Bind }) =>
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
                    }
                </Form>
            </div>
        );
    }
}
