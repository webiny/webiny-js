import React from "react";
import { inject } from "webiny-client";
import { WidgetSettingsContainer } from "webiny-client-cms/lib/admin";

@inject({
    modules: ["Form", "Icon"],
    services: ["cms"]
})
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

export default WidgetSettings;