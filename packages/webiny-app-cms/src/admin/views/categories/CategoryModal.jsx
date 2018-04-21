import React from "react";
import { createComponent } from "webiny-app";
import { ModalComponent } from "webiny-app-ui";

const categoryURL = value => {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Category URL must begin and end with a forward slash (`/`)");
};

class CategoryModal extends React.Component {
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
                    entity={"CmsCategory"}
                    fields={"id title slug url"}
                    onSubmitSuccess={() => {
                        this.props.hide().then(() => this.props.onSuccess());
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
                                                        placeholder="Enter category title"
                                                        validators="required"
                                                    />
                                                </Bind>
                                                <Bind>
                                                    <Input
                                                        label="Slug"
                                                        name="slug"
                                                        placeholder="Enter category slug"
                                                        validators="required"
                                                    />
                                                </Bind>
                                                <Bind>
                                                    <Input
                                                        label="URL"
                                                        placeholder="Enter category URL"
                                                        description={
                                                            "This URL will be added to all pages in this category."
                                                        }
                                                        name="url"
                                                        validators={["required", categoryURL]}
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

export default createComponent([CategoryModal, ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form", "FormData", "FormError", "Grid", "Loader"]
});
