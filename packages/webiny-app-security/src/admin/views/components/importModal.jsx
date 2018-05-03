import React from "react";
import _ from "lodash";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.Modal.ImportModal");

class ImportModal extends Webiny.Ui.ModalComponent {
    submit({ model, form }) {
        const data = JSON.parse(model.data);
        return form.onSubmit(data);
    }

    renderDialog() {
        const { Modal, Form, CodeEditor, Button, api, label } = this.props;

        const formProps = {
            api,
            onSuccessMessage: ({ model }) => (
                <span>
                    {label} <strong>{model.name}</strong> was imported!
                </span>
            ),
            onSubmit: this.submit,
            onSubmitSuccess: () => this.hide().then(this.props.onImported)
        };

        return (
            <Modal.Dialog>
                <Form {...formProps}>
                    {({ form }) => (
                        <Modal.Content>
                            <Form.Loader />
                            <Modal.Header
                                title={this.i18n(`Import {label}`, { label })}
                                onClose={this.hide}
                            />
                            <Modal.Body>
                                <Form.Error />
                                <CodeEditor
                                    mode="text/javascript"
                                    name="data"
                                    validators="required,json"
                                />
                            </Modal.Body>
                            <Modal.Footer>
                                <Button label={t`Import`} type="primary" onClick={form.submit} />
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>
        );
    }
}

ImportModal.defaultProps = _.assign({}, Webiny.Ui.ModalComponent.defaultProps, {
    api: "",
    label: "",
    onImported: _.noop
});

export default createComponent(ImportModal, { modules: ["Form", "Modal", "CodeEditor", "Button"] });
