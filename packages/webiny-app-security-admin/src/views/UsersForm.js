import React from "react";
import axios from "axios";
import _ from "lodash";

import { i18n, createComponent } from "webiny-app";

const t = i18n.namespace("Security.UsersForm");

class UsersForm extends React.Component {
    constructor() {
        super();
        this.state = { roles: [] };
    }

    async componentWillMount() {
        let response = await axios.get("/security/roles", {
            params: {
                _fields: "description,name,slug",
                _perPage: 1000,
                _sort: "name"
            }
        });
        this.setState({ roles: response.data.data.list });

        response = await axios.get("/security/role-groups", {
            params: {
                _fields: "description,name,slug",
                _perPage: 1000,
                _sort: "name"
            }
        });
        this.setState({ roleGroups: response.data.data.list });
    }

    render() {
        const {
            AdminLayout,
            SecurityToggleList,
            Form,
            Section,
            View,
            Grid,
            Tabs,
            Input,
            Button,
            Switch,
            Password
        } = this.props.modules;

        return (
            <AdminLayout>
                <Form
                    entity="SecurityUser"
                    withRouter
                    fields="id firstName lastName email roles { id } roleGroups { id enabled createdOn }"
                    onSubmitSuccess="Users.List"
                    onCancel="Users.List"
                    defaultModel={{ roleGroups: [], roles: [] }}
                    onSuccessMessage={data => (
                        <span>
                            {t`User {user} was saved successfully!`({
                                user: <strong>{data.model.firstName}</strong>
                            })}
                        </span>
                    )}
                >
                    {({ model, form }) => (
                        <View.Form>
                            <View.Header
                                title={
                                    model.id ? t`Security - Edit User` : t`Security - Create User`
                                }
                            />
                            <Form.Error message={t`Something went wrong during save`} />
                            <View.Body>
                                <Grid.Row>
                                    <Grid.Col all={6}>
                                        <Section title={t`Info`} />
                                        <Grid.Row>
                                            <Grid.Col all={12}>
                                                <Input
                                                    label={t`First name`}
                                                    name="firstName"
                                                    validate="required"
                                                />
                                                <Input
                                                    label={t`Last name`}
                                                    name="lastName"
                                                    validate="required"
                                                />
                                                <Input
                                                    label={t`Email`}
                                                    name="email"
                                                    description={t`Your email`}
                                                    validate="required,email"
                                                />
                                            </Grid.Col>
                                        </Grid.Row>
                                    </Grid.Col>
                                    <Grid.Col all={6}>
                                        <Section title={t`Password`} />
                                        <Grid.Row>
                                            <Grid.Col all={12}>
                                                <Password
                                                    label={t`New password`}
                                                    name="password"
                                                    placeholder={t`Type a new password`}
                                                />
                                                <Password
                                                    label={t`Confirm password`}
                                                    name="confirmPassword"
                                                    validate="eq:@password"
                                                    placeholder={t`Retype the new password`}
                                                >
                                                    <validator name="eq">
                                                        {t`Passwords do not match`}
                                                    </validator>
                                                </Password>
                                            </Grid.Col>
                                        </Grid.Row>
                                    </Grid.Col>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <Switch label={t`Enabled`} name="enabled" />
                                    </Grid.Col>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Col all={12}>
                                        <Tabs>
                                            <Tabs.Tab label={t`Roles`} icon="user">
                                                <SecurityToggleList
                                                    options={this.state.roles}
                                                    value={model.roles}
                                                    onChange={role => {
                                                        form.setState(state => {
                                                            const roleIndex = _.findIndex(
                                                                state.model.roles,
                                                                { id: role.id }
                                                            );

                                                            if (roleIndex >= 0) {
                                                                state.model.roles.splice(
                                                                    roleIndex,
                                                                    1
                                                                );
                                                            } else {
                                                                state.model.roles.push({
                                                                    id: role.id
                                                                });
                                                            }

                                                            return state;
                                                        });
                                                    }}
                                                />
                                            </Tabs.Tab>
                                            <Tabs.Tab label={t`Role Groups`} icon="users">
                                                <SecurityToggleList
                                                    options={this.state.roleGroups}
                                                    value={model.roleGroups}
                                                    onChange={roleGroup => {
                                                        form.setState(state => {
                                                            const roleGroupIndex = _.findIndex(
                                                                state.model.roleGroups,
                                                                { id: roleGroup.id }
                                                            );

                                                            if (roleGroupIndex >= 0) {
                                                                state.model.roleGroups.splice(
                                                                    roleGroupIndex,
                                                                    1
                                                                );
                                                            } else {
                                                                state.model.roleGroups.push({
                                                                    id: roleGroup.id
                                                                });
                                                            }

                                                            return state;
                                                        });
                                                    }}
                                                />
                                            </Tabs.Tab>
                                        </Tabs>
                                    </Grid.Col>
                                </Grid.Row>
                            </View.Body>
                            <View.Footer>
                                <Button type="default" onClick={form.cancel} label={t`Go back`} />
                                <Button
                                    type="primary"
                                    onClick={form.submit}
                                    label={t`Save user`}
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

export default createComponent(UsersForm, {
    modules: [
        "View",
        "Form",
        "Grid",
        "Tabs",
        "Input",
        "Password",
        "Switch",
        "Button",
        "Section",
        {
            AdminLayout: "Admin.Layout",
            SecurityToggleList: "Security.SecurityToggleList"
        }
    ]
});
