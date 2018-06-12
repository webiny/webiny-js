import React from "react";

import { i18n, createComponent, app } from "webiny-client";
const t = i18n.namespace("Security.Modal.ImportPolicyModal");
import { ModalComponent } from "webiny-client-ui";

class ImportPolicyModal extends React.Component {
    render() {
        const {
            Modal,
            Button,
            Form,
            FormData,
            FormError,
            Input,
            Grid,
            Loader,
            Textarea,
            CodeEditor
        } = this.props.modules;

        return (
            <Modal.Dialog>
                <FormData
                    entity={"SecurityPolicy"}
                    fields={"id"}
                    onSubmitSuccess={() => {
                        this.props.hide().then(() => this.props.onSuccess());
                    }}
                >
                    {({ model, onSubmit, error, loading, invalidFields }) => (
                        <Form
                            model={model}
                            onSubmit={({ data }) => {
                                console.log("ide");
                                return onSubmit(JSON.parse(data));
                            }}
                            invalidFields={invalidFields}
                        >
                            {({ form, Bind }) => (
                                <Modal.Content>
                                    {loading && <Loader />}
                                    <Modal.Header title={t`Import`} onClose={this.props.hide} />
                                    <Modal.Body>
                                        {error && <FormError error={error} />}
                                        <Grid.Row>
                                            <Grid.Col all={12}>
                                                <Bind>
                                                    <CodeEditor
                                                        mode="text/javascript"
                                                        name="data"
                                                        validators="required"
                                                    />
                                                </Bind>
                                            </Grid.Col>
                                        </Grid.Row>
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button
                                            type="default"
                                            label={t`Cancel`}
                                            onClick={this.props.hide}
                                        />

                                        <Button
                                            type="primary"
                                            label={t`Save`}
                                            onClick={form.submit}
                                        />
                                    </Modal.Footer>
                                </Modal.Content>
                            )}
                        </Form>
                    )}
                </FormData>
            </Modal.Dialog>
        );
    }
}

export default createComponent([ImportPolicyModal, ModalComponent], {
    modules: [
        "Modal",
        "Button",
        "Input",
        "Form",
        "FormData",
        "FormError",
        "Grid",
        "Loader",
        "Textarea",
        "CodeEditor"
    ]
});
