import React from "react";
import { inject } from "webiny-client";
import { withModalDialog } from "webiny-client-ui";

const categoryURL = value => {
    if (value.startsWith("/") && value.endsWith("/")) {
        return true;
    }

    throw new Error("Category URL must begin and end with a forward slash (`/`)");
};

@withModalDialog()
@inject({
    modules: ["Modal", "Button", "Input", "Form", "FormData", "FormError", "Grid", "Loader"]
})
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
                                                <Bind name="title" validators={["required"]}>
                                                    <Input label="Title" placeholder="Enter category title" />
                                                </Bind>
                                                <Bind name="slug" validators={["required"]}>
                                                    <Input label="Slug" placeholder="Enter category slug" />
                                                </Bind>
                                                <Bind name="url" validators={["required", categoryURL]}>
                                                    <Input
                                                        label="URL"
                                                        placeholder="Enter category URL"
                                                        description={
                                                            "This URL will be added to all pages in this category."
                                                        } />
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

export default CategoryModal;
