import React from "react";
import _ from "lodash";
import { app, Component } from "webiny-client";
import { withModalDialog } from "webiny-client-ui";
import slugify from "slugify";

@withModalDialog()
@Component({
    modules: [
        "Modal",
        "Button",
        "Form",
        "FormData",
        "FormError",
        "OptionsData",
        "Select",
        "Input",
        "Loader",
        "Icon",
        "Link"
    ]
})
class CreatePageDialog extends React.Component {
    generateSlug({ form, model }) {
        if (!model.title) {
            return;
        }

        form.setState(({ model }) => {
            return {
                model: {
                    ...model,
                    slug: slugify(model.title, {
                        remove: /[$#*_+~.()'"!\-:@]/g,
                        lower: true
                    })
                }
            };
        });
    }

    render() {
        const {
            modules: {
                Modal,
                Button,
                Form,
                FormData,
                FormError,
                OptionsData,
                Select,
                Input,
                Loader,
                Icon,
                Link
            },
            hide
        } = this.props;
        return (
            <Modal.Dialog>
                <FormData
                    entity={"CmsPage"}
                    fields={"activeRevision { id }"}
                    onSubmitSuccess={({ model }) =>
                        app.router.goToRoute("Cms.Page.Editor", { id: model.activeRevision.id })
                    }
                >
                    {({ onSubmit, loading, error }) => (
                        <Form
                            onSubmit={model => {
                                model.slug = model.category.url + model.slug;
                                onSubmit(model);
                            }}
                        >
                            {({ model, form, Bind }) => (
                                <Modal.Content>
                                    {loading && <Loader />}
                                    <Modal.Header title="Create page" onClose={hide} />
                                    <Modal.Body>
                                        {error && <FormError error={error} />}
                                        <OptionsData
                                            entity={"CmsCategory"}
                                            fields={"id title slug url"}
                                            labelField={"title"}
                                            perPage={100}
                                        >
                                            {({ options }) => (
                                                <Bind name={"category"}>
                                                    <Select
                                                        useDataAsValue
                                                        options={options}
                                                        placeholder={"Select a page category"}
                                                        label={"Page category"}
                                                        renderOption={({ option }) => (
                                                            <div>
                                                                <strong>{option.data.title}</strong>
                                                                <br />
                                                                <span>
                                                                    URL:{" "}
                                                                    <strong>
                                                                        {option.data.url}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        )}
                                                    />
                                                </Bind>
                                            )}
                                        </OptionsData>
                                        {model.category && (
                                            <Bind validators={"required"} name={"title"}>
                                                <Input
                                                    label={"Page title"}
                                                    placeholder={"Enter a page title"}
                                                    onBlur={() => {
                                                        if (_.isEmpty(model.slug)) {
                                                            this.generateSlug({ form, model });
                                                        }
                                                    }}
                                                />
                                            </Bind>
                                        )}

                                        {model.category && (
                                            <Bind name={"slug"}>
                                                <Input
                                                    label={"Page slug"}
                                                    placeholder={"Enter a page slug"}
                                                    addonLeft={model.category && model.category.url}
                                                    addonRight={
                                                        <Link
                                                            onClick={() =>
                                                                this.generateSlug({ form, model })
                                                            }
                                                        >
                                                            <Icon icon={"sync-alt"} />
                                                        </Link>
                                                    }
                                                />
                                            </Bind>
                                        )}
                                    </Modal.Body>
                                    <Modal.Footer align="right">
                                        <Button
                                            type="default"
                                            label="Cancel"
                                            onClick={this.props.hide}
                                        />
                                        <Button
                                            type="primary"
                                            disabled={!model.category}
                                            label="Create page"
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

export default CreatePageDialog;
