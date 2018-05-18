import React from "react";
import { createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

class LayoutModal extends React.Component {
    render() {
        const {
            Modal,
            Button,
            Form,
            FormData,
            FormError,
            Input,
            Grid,
            Loader
        } = this.props.modules;

        return (
            <Modal.Dialog>
                <FormData
                    defaultModel={this.props.data || {}}
                    entity={"CmsLayout"}
                    fields={"id title slug"}
                    onSubmitSuccess={({ model }) => {
                        this.props
                            .hide()
                            .then(() => app.router.goToRoute("Cms.Layout.Edit", { id: model.id }));
                    }}
                >
                    {({ model, onSubmit, error, loading, invalidFields }) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({ form, Bind }) => (
                                <Modal.Content>
                                    {loading && <Loader />}
                                    <Modal.Header title="Category" onClose={this.props.hide} />
                                    <Modal.Body>
                                        {error && <FormError error={error} />}
                                        <Grid.Row>
                                            <Grid.Col all={12}>
                                                <Bind>
                                                    <Input
                                                        label="Title"
                                                        name="title"
                                                        placeholder="Enter layout title"
                                                        validators="required"
                                                    />
                                                </Bind>
                                                <Bind>
                                                    <Input
                                                        label="Slug"
                                                        name="slug"
                                                        placeholder="Enter layout slug"
                                                        validators="required"
                                                    />
                                                </Bind>
                                            </Grid.Col>
                                        </Grid.Row>
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button
                                            type="default"
                                            label="Cancel"
                                            onClick={this.props.hide}
                                        />
                                        <Button type="primary" label="Save" onClick={form.submit} />
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

export default createComponent([LayoutModal, ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form", "FormData", "FormError", "Grid", "Loader"]
});
