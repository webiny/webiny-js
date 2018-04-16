import React from "react";
import _ from "lodash";
import { app } from "webiny-app";
import gql from "graphql-tag";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RolesForm");

class RolesForm extends React.Component {
    constructor() {
        super();
        this.state = { permissions: [] };
    }

    async componentWillMount() {
        const query = gql`
            {
                listSecurityPermissions {
                    list {
                        id
                        description
                        name
                        slug
                    }
                }
            }
        `;

        app.graphql.query({ query }).then(response => {
            this.setState({ permissions: response.data.listSecurityPermissions.list });
        });
    }

    render() {
        const {
            AdminLayout,
            SecurityToggleList,
            Form,
            Section,
            View,
            Grid,
            Input,
            Button
        } = this.props.modules;

        return (
            <AdminLayout>
                <Form
                    entity="SecurityRole"
                    withRouter
                    fields="id name slug description permissions { id }"
                    defaultModel={{ permissions: [] }}
                    onSubmitSuccess="Roles.List"
                    onCancel="Roles.List"
                    onSuccessMessage={({ model }) => {
                        return (
                            <span>
                                {t`Role {role} was saved successfully!`({
                                    role: <strong>{model.name}</strong>
                                })}
                            </span>
                        );
                    }}
                >
                    {({ model, form }) => (
                        <View.Form>
                            <View.Header
                                title={
                                    model.id ? t`Security - Edit Role` : t`Security - Create Role`
                                }
                            />
                            <View.Body>
                                <Section title={t`General`} />
                                <Grid.Row>
                                    <Grid.Col all={6}>
                                        <Input label={t`Name`} name="name" validate="required" />
                                    </Grid.Col>
                                    <Grid.Col all={6}>
                                        <Input label={t`Slug`} name="slug" validate="required" />
                                    </Grid.Col>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <Input
                                            label={t`Description`}
                                            name="description"
                                            validate="required"
                                        />
                                    </Grid.Col>
                                </Grid.Row>
                                <SecurityToggleList
                                    options={this.state.permissions}
                                    value={model.permissions}
                                    onChange={permission => {
                                        form.setState(state => {
                                            const permissionIndex = _.findIndex(
                                                state.model.permissions,
                                                { id: permission.id }
                                            );

                                            if (permissionIndex >= 0) {
                                                state.model.permissions.splice(permissionIndex, 1);
                                            } else {
                                                state.model.permissions.push({ id: permission.id });
                                            }

                                            console.log("setao se state");
                                            return state;
                                        });
                                    }}
                                />
                            </View.Body>
                            <View.Footer>
                                <Button type="default" onClick={form.cancel} label={t`Go back`} />
                                <Button
                                    type="primary"
                                    onClick={form.submit}
                                    label={t`Save role`}
                                    align="right"
                                />
                            </View.Footer>
                        </View.Form>
                    )}
                </Form>
            </AdminLayout>
        );
    }
}

export default createComponent(RolesForm, {
    modules: [
        "Form",
        "View",
        "Input",
        "Button",
        "Grid",
        "Section",
        {
            SecurityToggleList: "Security.SecurityToggleList",
            AdminLayout: "Admin.Layout"
        }
    ]
});
