import React from "react";
import _ from "lodash";
import { app, Component } from "webiny-client";
import { withModalDialog } from "webiny-client-ui";

@withModalDialog()
@Component({
    modules: ["Modal", "Button", "Form", "FormData", "FormError", "Input", "Loader"]
})
class CreateRevisionDialog extends React.Component {
    render() {
        const {
            page,
            data,
            modules: { Modal, Button, Form, FormData, FormError, Input, Loader },
            hide
        } = this.props;

        const newModel = _.pick(data.source, ["title", "slug", "content"]);
        newModel.name = "Revision #" + (page.revisions.length + 1);
        newModel.page = page.id;

        return (
            <Modal.Dialog>
                <FormData
                    defaultModel={newModel}
                    entity={"CmsRevision"}
                    fields={"id"}
                    onSubmitSuccess={({ model }) =>
                        app.router.goToRoute("Cms.Page.Editor", { id: model.id })
                    }
                >
                    {({ model, onSubmit, loading, error }) => (
                        <Form model={model} onSubmit={onSubmit}>
                            {({ model, form, Bind }) => (
                                <Modal.Content>
                                    {loading && <Loader />}
                                    <Modal.Header title="Create a revision" onClose={hide} />
                                    <Modal.Body>
                                        {error && <FormError error={error} />}
                                        <Bind validators={"required"} name={"name"}>
                                            <Input autoFocus label={"Revision name"} placeholder={"Enter a revision name"} />
                                        </Bind>
                                    </Modal.Body>
                                    <Modal.Footer align="right">
                                        <Button
                                            type="default"
                                            label="Cancel"
                                            onClick={this.props.hide}
                                        />
                                        <Button
                                            type="primary"
                                            label="Create"
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

export default CreateRevisionDialog;
