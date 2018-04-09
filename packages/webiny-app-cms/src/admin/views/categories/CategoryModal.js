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
        const { Modal, Button, Form, Input, Grid } = this.props.modules;

        const formProps = {
            entity: "CmsCategory",
            loadModel: () => Promise.resolve(this.props.data || {}),
            fields: "id title slug url",
            onSubmitSuccess: () => {
                this.props.hide().then(() => {
                    this.props.onSuccess();
                });
            },
            onCancel: this.props.hide
        };

        return (
            <Modal.Dialog>
                <Form {...formProps}>
                    {({ form }) => (
                        <Modal.Content>
                            <Form.Loader />
                            <Modal.Header title="Category" onClose={this.props.hide} />
                            <Modal.Body>
                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <Input
                                            label="Title"
                                            name="title"
                                            placeholder="Enter category title"
                                            validators="required"
                                        />
                                        <Input
                                            label="Slug"
                                            name="slug"
                                            placeholder="Enter category slug"
                                            validators="required"
                                        />
                                        <Input
                                            label="URL"
                                            placeholder="Enter category URL"
                                            description={
                                                "This URL will be added to all pages in this category."
                                            }
                                            name="url"
                                            validators={["required", categoryURL]}
                                        />
                                    </Grid.Col>
                                </Grid.Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button type="default" label="Cancel" onClick={this.props.hide} />
                                <Button type="primary" label="Save" onClick={form.submit} />
                            </Modal.Footer>
                        </Modal.Content>
                    )}
                </Form>
            </Modal.Dialog>
        );
    }
}

export default createComponent([CategoryModal, ModalComponent], {
    modules: ["Modal", "Button", "Input", "Form", "Grid"]
});
