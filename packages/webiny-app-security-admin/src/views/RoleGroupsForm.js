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
        const { Ui } = this.props;

        return (
            <Ui.AdminLayout>
                <Ui.Form
                    api="/security/role-groups"
                    fields="name,slug,description,roles.id"
                    defaultModel={{ roles: [] }}
                    connectToRouter
                    onSubmitSuccess="RoleGroups.List"
                    onCancel="RoleGroups.List"
                    onSuccessMessage={({ model }) => (
                        <span>
                            {t`Role group {group} was saved successfully!`({ group: model.name })}
                        </span>
                    )}
                >
                    {({ model, form }) => (
                        <Ui.View.Form>
                            <Ui.View.Header
                                title={
                                    model.id
                                        ? t`Security - Edit Role Group`
                                        : t`Security - Create Role Group`
                                }
                            />
                            <Ui.View.Body>
                                <Ui.Section title={t`General`} />
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Input label={t`Name`} name="name" validate="required" />
                                    </Ui.Grid.Col>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Input label={t`Slug`} name="slug" validate="required" />
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.Input
                                            label={t`Description`}
                                            name="description"
                                            validate="required"
                                        />
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.SecurityToggleList
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
                                    label={t`Save role group`}
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

export default createComponent(RoleGroupsForm, {
    modulesProp: "Ui",
    modules: [
        "Switch",
        "Form",
        "View",
        "Tabs",
        "Input",
        "Button",
        "Grid",
        "Section",
        {
            AdminLayout: "Skeleton.AdminLayout",
            SecurityToggleList: "Security.SecurityToggleList"
        }
    ]
});
