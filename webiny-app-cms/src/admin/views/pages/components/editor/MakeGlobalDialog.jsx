import React from "react";
import { app, createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

class MakeGlobalDialog extends React.Component {
    render() {
        const { modules: { Modal, Button, Input, Form }, services: { cms }, widget, hide } = this.props;
        return (
            <Modal.Dialog>
                <Form
                    onSubmit={({ title }) => {
                        cms
                            .createGlobalWidget({
                                title,
                                type: widget.type,
                                data: widget.data,
                                settings: widget.settings
                            })
                            .then(origin => {
                                hide().then(() => this.props.onSuccess(origin));
                            });
                    }}
                >
                    {({ submit, model, Bind }) => (
                        <Modal.Content>
                            <Modal.Header title="Save to global widgets" onClose={hide} />
                            <Modal.Body>
                                <Bind>
                                    <Input
                                        name={"title"}
                                        label={"Widget title"}
                                        placeholder={"Enter a title for your widget"}
                                        validators={"required"}
                                    />
                                </Bind>
                            </Modal.Body>
                            <Modal.Footer align="right">
                                <Button type="default" label="Cancel" onClick={hide} />
                                <Button type="primary" label="Save widget" onClick={submit} />
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>
        );
    }
}

export default createComponent([MakeGlobalDialog, ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form"],
    services: ["cms"]
});
