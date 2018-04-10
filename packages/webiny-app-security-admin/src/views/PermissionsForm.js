import React from "react";
import FieldsList from "./PermissionsForm/FieldsList";
import { i18n, app, createComponent } from "webiny-app";
const t = i18n.namespace("Security.PermissionsForm");

const graph = {
    data: {
        query: {
            name: "Query",
            fields: [
                {
                    name: "getSecurityUser",
                    description: "Get a single SecurityUser entity by ID."
                },
                {
                    name: "listSecurityUsers",
                    description: "Get a list of SecurityUser entities."
                },
                {
                    name: "getSecurityRole",
                    description: "Get a single SecurityRole entity by ID."
                },
                {
                    name: "listSecurityRoles",
                    description: "Get a list of SecurityRole entities."
                },
                {
                    name: "getSecurityRoleGroup",
                    description: "Get a single SecurityRoleGroup entity by ID."
                },
                {
                    name: "listSecurityRoleGroups",
                    description: "Get a list of SecurityRoleGroup entities."
                },
                {
                    name: "getSecurityPermission",
                    description: "Get a single SecurityPermission entity by ID."
                },
                {
                    name: "listSecurityPermissions",
                    description: "Get a list of SecurityPermission entities."
                },
                {
                    name: "loginSecurityUser",
                    description: null
                },
                {
                    name: "getIdentity",
                    description: null
                },
                {
                    name: "sendInvoiceToUser",
                    description: "Send email with invoice in the attachment"
                }
            ]
        },
        mutation: {
            name: "Mutation",
            fields: [
                {
                    name: "createSecurityUser",
                    description: "Create a single SecurityUser entity."
                },
                {
                    name: "updateSecurityUser",
                    description: "Update a single SecurityUser entity."
                },
                {
                    name: "deleteSecurityUser",
                    description: "Delete a single SecurityUser entity."
                },
                {
                    name: "createSecurityRole",
                    description: "Create a single SecurityRole entity."
                },
                {
                    name: "updateSecurityRole",
                    description: "Update a single SecurityRole entity."
                },
                {
                    name: "deleteSecurityRole",
                    description: "Delete a single SecurityRole entity."
                },
                {
                    name: "createSecurityRoleGroup",
                    description: "Create a single SecurityRoleGroup entity."
                },
                {
                    name: "updateSecurityRoleGroup",
                    description: "Update a single SecurityRoleGroup entity."
                },
                {
                    name: "deleteSecurityRoleGroup",
                    description: "Delete a single SecurityRoleGroup entity."
                },
                {
                    name: "createSecurityPermission",
                    description: "Create a single SecurityPermission entity."
                },
                {
                    name: "updateSecurityPermission",
                    description: "Update a single SecurityPermission entity."
                },
                {
                    name: "deleteSecurityPermission",
                    description: "Delete a single SecurityPermission entity."
                },
                {
                    name: "updateIdentity",
                    description: null
                }
            ]
        }
    }
};

class PermissionsForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
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
        const newUserPermission = !app.router.getParams("id");
        const { AdminLayout, Form, Section, View, Grid, Tabs, Input, Button } = this.props.modules;

        return (
            <AdminLayout>
                <Form
                    entity="SecurityPermission"
                    withRouter
                    fields="id name slug description fields"
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
                    {({ model, form }) => {
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
                                            <Input
                                                label={t`Name`}
                                                name="name"
                                                validate="required"
                                            />
                                        </Grid.Col>
                                        <Grid.Col all={6}>
                                            <Input label={t`Slug`} name="slug" />
                                        </Grid.Col>
                                    </Grid.Row>
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Input
                                                label={t`Description`}
                                                name="description"
                                                validate="required"
                                            />
                                            <Tabs>
                                                <Tabs.Tab label={t`Queries`}>
                                                    {(newUserPermission || model.id) && (
                                                        <FieldsList
                                                            model={model}
                                                            fields={graph.data.query.fields}
                                                            onToggleField={field =>
                                                                this.onToggleField(
                                                                    model,
                                                                    form,
                                                                    field
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </Tabs.Tab>
                                                <Tabs.Tab label={t`Mutations`}>
                                                    {(newUserPermission || model.id) && (
                                                        <FieldsList
                                                            model={model}
                                                            fields={graph.data.mutation.fields}
                                                            onToggleField={field =>
                                                                this.onToggleField(
                                                                    model,
                                                                    form,
                                                                    field
                                                                )
                                                            }
                                                        />
                                                    )}
                                                </Tabs.Tab>
                                            </Tabs>
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
        "Tabs",
        "Input",
        "Button"
    ]
});
