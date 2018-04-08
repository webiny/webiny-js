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
        const { Ui } = this.props;

        return (
            <Ui.AdminLayout>
                <Ui.Form
                    api="security/users"
                    fields="id,firstName,lastName,email,roles.id,roleGroups.id,enabled,createdOn"
                    connectToRouter
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
                        <Ui.View.Form>
                            <Ui.View.Header
                                title={
                                    model.id ? t`Security - Edit User` : t`Security - Create User`
                                }
                            />
                            <Ui.Form.Error message={t`Something went wrong during save`} />
                            <Ui.View.Body>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Section title={t`Info`} />
                                        <Ui.Grid.Row>
                                            <Ui.Grid.Col all={12}>
                                                <Ui.Date
                                                    label={t`Created`}
                                                    name="createdOn"
                                                    validate="required"
                                                />
                                                <Ui.Input
                                                    label={t`First name`}
                                                    name="firstName"
                                                    validate="required"
                                                />
                                                <Ui.Input
                                                    label={t`Last name`}
                                                    name="lastName"
                                                    validate="required"
                                                />
                                                <Ui.Input
                                                    label={t`Email`}
                                                    name="email"
                                                    description={t`Your email`}
                                                    validate="required,email"
                                                />
                                            </Ui.Grid.Col>
                                        </Ui.Grid.Row>
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Section title={t`Password`} />
                                        <Ui.Grid.Row>
                                            <Ui.Grid.Col all={12}>
                                                <Ui.Password
                                                    label={t`New password`}
                                                    name="password"
                                                    placeholder={t`Type a new password`}
                                                />
                                                <Ui.Password
                                                    label={t`Confirm password`}
                                                    name="confirmPassword"
                                                    validate="eq:@password"
                                                    placeholder={t`Retype the new password`}
                                                >
                                                    <validator name="eq">
                                                        {t`Passwords do not match`}
                                                    </validator>
                                                </Ui.Password>
                                            </Ui.Grid.Col>
                                        </Ui.Grid.Row>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.Switch label={t`Enabled`} name="enabled" />
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.Tabs>
                                            <Ui.Tabs.Tab label={t`Roles`} icon="user">
                                                <Ui.SecurityToggleList
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
                                            </Ui.Tabs.Tab>
                                            <Ui.Tabs.Tab label={t`Role Groups`} icon="users">
                                                <Ui.SecurityToggleList
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
                                            </Ui.Tabs.Tab>
                                        </Ui.Tabs>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                            </Ui.View.Body>
                            <Ui.View.Footer>
                                <Ui.Button
                                    type="default"
                                    onClick={form.cancel}
                                    label={t`Go back`}
                                />
                                <Ui.Button
                                    type="primary"
                                    onClick={form.submit}
                                    label={t`Save user`}
                                    align="right"
                                />
                            </Ui.View.Footer>
                        </Ui.View.Form>
                    )}
                </Ui.Form>
            </Ui.AdminLayout>
        );
    }
}

export default createComponent(UsersForm, {
    modulesProp: "Ui",
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
        "Date",
        {
            AdminLayout: "Skeleton.AdminLayout",
            SecurityToggleList: "Security.SecurityToggleList"
        }
    ]
});
