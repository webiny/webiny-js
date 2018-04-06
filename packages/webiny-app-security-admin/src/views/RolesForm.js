import React from "react";
import _ from "lodash";
import axios from "axios";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.RolesForm");

class RolesForm extends React.Component {
    constructor() {
        super();
        this.state = { permissions: [] };
    }

    async componentWillMount() {
        const response = await axios.get("/security/permissions", {
            params: {
                _fields: "description,name,slug",
                _perPage: 1000,
                _sort: "name"
            }
        });
        this.setState({ permissions: response.data.data.list });
    }

    render() {
        const { Ui } = this.props;

        return (
            <Ui.AdminLayout>
                <Ui.Form
                    api="/security/roles"
                    fields="name,slug,description,permissions.id"
                    defaultModel={{ permissions: [] }}
                    connectToRouter={true}
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
                        <Ui.View.Form>
                            <Ui.View.Header
                                title={
                                    model.id ? t`Security - Edit Role` : t`Security - Create Role`
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
                                    label={t`Save role`}
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

export default createComponent(RolesForm, {
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
            SecurityToggleList: "Security.SecurityToggleList",
            AdminLayout: "Skeleton.AdminLayout"
        }
    ]
});
