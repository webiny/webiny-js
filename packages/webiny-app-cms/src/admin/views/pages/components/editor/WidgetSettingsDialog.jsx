import React from "react";
import { app, createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";
import EditorWidgetSettings from "./EditorWidgetSettings";

class WidgetSettingsDialog extends React.Component {
    render() {
        const {
            modules: { Modal, Button, Form, Alert },
            services: { cms },
            widget,
            onChange,
            isGlobal
        } = this.props;

        let editorWidget = cms.getEditorWidget(widget.type);

        let title = "Widget settings";
        if (widget.origin) {
            title = "Global widget settings";
        }

        return (
            <Modal.Dialog>
                <Form
                    model={widget.settings || {}}
                    onSubmit={model => this.props.hide().then(() => this.props.onChange(model))}
                >
                    {({ model, submit, Bind }) => (
                        <Modal.Content>
                            <Modal.Header title={title} onClose={this.props.hide} />
                            <Modal.Body>
                                {widget.origin && (
                                    <Alert type={"warning"}>
                                        These settings affect this widget everywhere on the website!
                                    </Alert>
                                )}
                                {React.cloneElement(
                                    editorWidget.widget.renderSettings({
                                        EditorWidgetSettings,
                                        widget
                                    }),
                                    {
                                        Bind,
                                        settings: model,
                                        widget,
                                        onChange,
                                        isGlobal
                                    }
                                )}
                            </Modal.Body>
                            <Modal.Footer align="right">
                                <Button type="default" label="Cancel" onClick={this.props.hide} />
                                <Button type="primary" label="Save settings" onClick={submit} />
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>
        );
    }
}

export default createComponent([WidgetSettingsDialog, ModalComponent], {
    modules: ["Form", "Modal", "Button", "Alert"],
    services: ["cms"]
});
