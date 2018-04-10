import React from "react";
import { i18n, createComponent } from "webiny-app";
import axios from "axios";
import _ from "lodash";

const t = i18n.namespace("Security.RoleGroupsForm");

class RoleGroupsForm extends React.Component {
    constructor() {
        super();
        this.state = { roles: [] };
    }

    async componentWillMount() {
        const response = await axios.get("/security/roles", {
            params: {
                _fields: "description,name,slug",
                _perPage: 1000,
                _sort: "name"
            }
        });
        this.setState({ roles: response.data.data.list });
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
                    entity="SecurityRoleGroup"
                    withRouter
                    fields="id name slug description roles { id }"
                    defaultModel={{ roles: [] }}
                    onSubmitSuccess="RoleGroups.List"
                    onCancel="RoleGroups.List"
                    onSuccessMessage={({ model }) => (
                        <span>
                            {t`Role group {group} was saved successfully!`({ group: model.name })}
                        </span>
                    )}
                >
                    {({ model, form }) => (
                        <View.Form>
                            <View.Header
                                title={
                                    model.id
                                        ? t`Security - Edit Role Group`
                                        : t`Security - Create Role Group`
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
                                    options={this.state.roles}
                                    value={model.roles}
                                    onChange={role => {
                                        form.setState(state => {
                                            const roleIndex = _.findIndex(state.model.roles, {
                                                id: role.id
                                            });

                                            if (roleIndex >= 0) {
                                                state.model.roles.splice(roleIndex, 1);
                                            } else {
                                                state.model.roles.push({ id: role.id });
                                            }

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
                                    label={t`Save role group`}
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

export default createComponent(RoleGroupsForm, {
    modules: [
        "Form",
        "View",
        "Input",
        "Button",
        "Grid",
        "Section",
        {
            AdminLayout: "Admin.Layout",
            SecurityToggleList: "Security.SecurityToggleList"
        }
    ]
});
