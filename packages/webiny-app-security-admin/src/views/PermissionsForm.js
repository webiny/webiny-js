import React from "react";
import { FormData } from "webiny-graphql-ui";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.PermissionsForm");

class PermissionsForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            graphql: null
        };
    }

    onToggleField(model, form, field) {
        form.setState(state => {
            if (!state.model.fields) {
                state.model.fields = [];
            }

            let fieldIndex = state.model.fields.indexOf(field);
            if (fieldIndex >= 0) {
                state.model.fields.splice(fieldIndex, 1);
            } else {
                state.model.fields.push(field);
            }
            return state;
        });
    }

    render() {
        const { AdminLayout, Form, Section, View, Grid, Input, Button, Tags } = this.props.modules;

        return (
            <AdminLayout>
                <FormData
                    entity="SecurityPermission"
                    withRouter
                    fields="id name slug description fields createdOn customDate customTime customDateRange"
                    onSubmitSuccess="Permissions.List"
                    onCancel="Permissions.List"
                    defaultModel={{ fields: [] }}
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Permission {permission} was saved successfully!`({
                                    permission: <strong>{model.name}</strong>
                                })}
                            </span>
                        );
                    }}
                >
                    {({ model, onSubmit, invalidFields }) => (
                        <Form model={model} onSubmit={onSubmit} invalidFields={invalidFields}>
                            {({ model, form, Bind }) => {
                                return (
                                    <View.Form>
                                        <View.Header
                                            title={
                                                model.id
                                                    ? t`Security - Edit permission`
                                                    : t`Security - Create permission`
                                            }
                                        />
                                        <View.Body>
                                            <Section title={t`General`} />
                                            <Grid.Row>
                                                <Grid.Col all={6}>
                                                    <Bind>
                                                        <Input
                                                            label={t`Name`}
                                                            name="name"
                                                            validate="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                                <Grid.Col all={6}>
                                                    <Bind>
                                                        <Input label={t`Slug`} name="slug" />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Bind>
                                                        <Input
                                                            label={t`Description`}
                                                            name="description"
                                                            validate="required"
                                                        />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                            <Grid.Row>
                                                <Grid.Col all={12}>
                                                    <Bind>
                                                        <Tags label={t`Scope`} name="scope" />
                                                    </Bind>
                                                </Grid.Col>
                                            </Grid.Row>
                                        </View.Body>
                                        <View.Footer>
                                            <Button
                                                type="default"
                                                onClick={form.cancel}
                                                label={t`Go back`}
                                            />
                                            <Button
                                                type="primary"
                                                onClick={form.submit}
                                                label={t`Save permission`}
                                                align="right"
                                            />
                                        </View.Footer>
                                    </View.Form>
                                );
                            }}
                        </Form>
                    )}
                </FormData>
            </AdminLayout>
        );
    }
}

export default createComponent(PermissionsForm, {
    modules: [
        { AdminLayout: "Admin.Layout" },
        "Form",
        "Section",
        "View",
        "Grid",
        "Input",
        "Tags",
        "Button"
    ]
});
